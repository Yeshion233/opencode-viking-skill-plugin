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
   - If accepted: creates `~/.config/opencode/viking.json` with credentials
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

### Option 2: Viking Config File

Create `~/.config/opencode/viking.json`:

```json
{
  "skill_api_url": "https://your-viking-api.com",
  "skill_ak": "your-access-key",
  "skill_sk": "your-secret-key",
  "skill_cache_dir": "/path/to/cache"
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

### Reload a Viking Skill

```
/viking_skill_load
```

### Using Viking Skills in Context

## Development

```bash
bun install    # Install dependencies
bun run build  # Build the plugin
bun run typecheck  # Run type checking
```

## License

MIT
