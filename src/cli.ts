#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import * as readline from "node:readline";

const OPENCODE_CONFIG_DIR = join(homedir(), ".config", "opencode");
const PLUGIN_NAME = "opencode-viking-skill-plugin@latest";

function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function confirm(rl: readline.Interface, question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n) `, (answer) => {
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

async function askInput(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${question} `, (answer) => {
      resolve(answer.trim());
    });
  });
}

function findOpencodeConfig(): string | null {
  const candidates = [
    join(OPENCODE_CONFIG_DIR, "opencode.jsonc"),
    join(OPENCODE_CONFIG_DIR, "opencode.json"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

function addPluginToConfig(configPath: string): boolean {
  try {
    const content = readFileSync(configPath, "utf-8");
    
    const config = JSON.parse(content);
    
    if (!config.plugin) {
      config.plugin = [];
    }
    
    if (config.plugin.includes(PLUGIN_NAME)) {
      console.log("✓ Plugin already registered in config");
      return true;
    }
    
    config.plugin.push(PLUGIN_NAME);
    
    const newContent = JSON.stringify(config, null, 2);
    writeFileSync(configPath, newContent);

    console.log(`✓ Added plugin to ${configPath}`);
    return true;
  } catch (err) {
    console.error("✗ Failed to update config:", err);
    return false;
  }
}

function addCommandToConfig(configPath: string): boolean {
  try {
    const content = readFileSync(configPath, "utf-8");
    
    const config = JSON.parse(content);
    
    if (!config.command) {
      config.command = {};
    }
    
    if (config.command.viking_skill_list) {
      console.log("✓ Command already registered in config");
      return true;
    }
    
    config.command.viking_skill_list = {
      template: "/viking_skill mode=list",
      description: "List available Viking skills"
    };
    
    config.command.viking_skill_load = {
      template: "/viking_skill mode=load name={skill-id}",
      description: "Load the latest version of a Viking skill"
    };
    
    const newContent = JSON.stringify(config, null, 2);
    writeFileSync(configPath, newContent);

    console.log(`✓ Added command to ${configPath}`);
    return true;
  } catch (err) {
    console.error("✗ Failed to add command to config:", err);
    return false;
  }
}

function createNewConfig(): boolean {
  const configPath = join(OPENCODE_CONFIG_DIR, "opencode.jsonc");
  mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
  
  const config = `{
  "plugin": ["${PLUGIN_NAME}"],
  "viking_skill": {
    "apiUrl": "https://your-viking-api.com",
    "ak": "your-access-key",
    "sk": "your-secret-key"
  }
}
 `;
  
  writeFileSync(configPath, config);
  console.log(`✓ Created ${configPath}`);
  return true;
}

function addVikingConfigToConfig(configPath: string, apiUrl: string, ak: string, sk: string): boolean {
  try {
    const content = readFileSync(configPath, "utf-8");
    const config = JSON.parse(content);
    
    config.viking_skill = {
      apiUrl,
      ak,
      sk
    };
    
    const newContent = JSON.stringify(config, null, 2);
    writeFileSync(configPath, newContent);

    console.log(`✓ Added Viking skill configuration to ${configPath}`);
    return true;
  } catch (err) {
    console.error("✗ Failed to add Viking skill configuration:", err);
    return false;
  }
}

function addCommand(): boolean {
  const configPath = findOpencodeConfig();
  if (!configPath) {
    console.error("✗ No OpenCode config found");
    return false;
  }
  return addCommandToConfig(configPath);
}

interface InstallOptions {
  tui: boolean;
}

async function install(options: InstallOptions): Promise<number> {
  console.log("\n🪓 opencode-viking-skill-plugin installer\n");

  const rl = options.tui ? createReadline() : null;

  console.log("Step 1: Register plugin in OpenCode config");
  const configPath = findOpencodeConfig();
  
  if (configPath) {
    if (options.tui) {
      const shouldModify = await confirm(rl!, `Add plugin to ${configPath}?`);
      if (!shouldModify) {
        console.log("Skipped.");
      } else {
        addPluginToConfig(configPath);
      }
    } else {
      addPluginToConfig(configPath);
    }
  } else {
    if (options.tui) {
      const shouldCreate = await confirm(rl!, "No OpenCode config found. Create one?");
      if (!shouldCreate) {
        console.log("Skipped.");
      } else {
        createNewConfig();
      }
    } else {
      createNewConfig();
    }
  }

  console.log("\nStep 2: Add /viking_skill_list command to config");
  if (options.tui) {
    const shouldCreate = await confirm(rl!, "Add /viking_skill_list command to config?");
    if (!shouldCreate) {
      console.log("Skipped.");
    } else {
      addCommand();
    }
  } else {
    addCommand();
  }

  console.log("\nStep 3: Configure Viking skill credentials");
  const currentConfigPath = findOpencodeConfig();
  let credentialsConfigured = false;
  
  if (currentConfigPath && options.tui) {
    const shouldAddConfig = await confirm(rl!, "Add Viking skill configuration to opencode.json?");
    if (shouldAddConfig) {
      const apiUrl = await askInput(rl!, "Enter Viking API URL (e.g., https://your-viking-api.com):");
      const ak = await askInput(rl!, "Enter Access Key (AK):");
      const sk = await askInput(rl!, "Enter Secret Key (SK):");
      
      if (apiUrl && ak && sk) {
        addVikingConfigToConfig(currentConfigPath, apiUrl, ak, sk);
        credentialsConfigured = true;
      }
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log("\n✓ Setup complete! Restart OpenCode to activate.\n");
  console.log("Use /viking_skill_list to see available Viking skills.\n");
  
  if (!credentialsConfigured) {
    console.log("Configure Viking skill credentials using one of these methods:\n");
    console.log("Option 1: Set environment variables (priority):");
    console.log("  export VIKING_SKILL_API_URL=\"https://your-viking-api.com\"");
    console.log("  export VIKING_SKILL_AK=\"your-access-key\"");
    console.log("  export VIKING_SKILL_SK=\"your-secret-key\"\n");
    console.log("Option 2: Add to ~/.config/opencode/opencode.jsonc:");
    console.log("  \"viking_skill\": {");
    console.log("    \"apiUrl\": \"https://your-viking-api.com\",");
    console.log("    \"ak\": \"your-access-key\",");
    console.log("    \"sk\": \"your-secret-key\"");
    console.log("  }\n");
  }

  if (rl) rl.close();
  return 0;
}

function printHelp(): void {
  console.log(`
opencode-viking-skill-plugin - Viking skills for OpenCode agents

Commands:
  install                    Install and configure the plugin
    --no-tui                 Run in non-interactive mode (for LLM agents)

Examples:
  bunx opencode-viking-skill-plugin@latest install
  bunx opencode-viking-skill-plugin@latest install --no-tui
`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
  printHelp();
  process.exit(0);
}

if (args[0] === "install") {
  const noTui = args.includes("--no-tui");
  install({ tui: !noTui }).then((code) => process.exit(code));
} else {
  console.error(`Unknown command: ${args[0]}`);
  printHelp();
  process.exit(1);
}
