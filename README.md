# OpenCode Viking Skill Plugin

OpenCode plugin for loading and using Viking remote skills.

## Installation

```bash
bunx opencode-viking-skill-plugin@latest install
```

The install command will:
1. Register the plugin in `~/.config/opencode/opencode.jsonc`
2. Add `/viking_skill_list` command to list available Viking skills
3. Add `/viking_skill_load` command to load a specific Viking skill
4. Prompt you to configure Viking skill credentials (optional)
   - If accepted: adds configuration to opencode.jsonc
   - If declined: displays instructions for environment variables or manual config

Or let your agent do it - paste this into OpenCode:

```text
Install opencode-viking-skill-plugin by following https://github.com/Yeshion233/opencode-viking-skill-plugin/blob/main/README.md
```

## Configuration

Viking skill credentials can be configured in two ways (environment variables take priority):

### Option 1: Environment Variables (Priority)

```bash
export VIKING_SKILL_API_URL="https://your-viking-api.com"
export VIKING_SKILL_AK="your-access-key"
export VIKING_SKILL_SK="your-secret-key"
```

Optional: Set custom cache directory (default: `~/.opencode/skill`)

```bash
export VIKING_SKILL_CACHE_DIR="/path/to/cache"
```

### Option 2: OpenCode Config File

Add to `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "plugin": [ "opencode-viking-skill-plugin" ],
  "viking_skill": {
    "apiUrl": "https://your-viking-api.com",
    "ak": "your-access-key",
    "sk": "your-secret-key",
    "cacheDir": "/path/to/cache"  // Optional, default: ~/.opencode/skill
  }
}
```

## Features

1. **Startup Skill Loading**: Automatically fetches and caches available Viking skills from the remote API on startup
2. **Context-Aware Skill Usage**: Seamlessly integrates Viking skills into conversation context for intelligent task execution

## Usage

### List Available Viking Skills

```
/viking_skill_list
```

### Load a Viking Skill

```
/viking_skill_load name=skill-id
```

### Using Viking Skills in Context

When skills are loaded, they become available in the conversation context:

```
[Viking Skills Available]
The following Viking skills are available for use:
  - infographic-: infographic-creator
  - infographic-item-creator: infographic-item-creator
  - infographic-structure-creator: infographic-structure-creator
  - infographic-template-updater: infographic-template-updater
  - pdf: pdf

Use the skill tool with the skill name to load detailed instructions.
```

## Development

```bash
bun install    # Install dependencies
bun run build  # Build the plugin
bun run typecheck  # Run type checking
```

## License

MIT
