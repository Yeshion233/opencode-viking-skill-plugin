# OpenCode Viking Skill Plugin

OpenCode plugin for loading and using Viking remote skills.

## Installation

### Automatic Installation

```bash
bunx opencode-viking-skill-plugin@latest install
```

### Manual Configuration

Add to `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "plugin": ["opencode-viking-skill-plugin"]
}
```

### Environment Variables

Set the required environment variables:

```bash
export VIKING_SKILL_API_URL="https://your-viking-api.com"
export VIKING_SKILL_AK="your-access-key"
export VIKING_SKILL_SK="your-secret-key"
```

## Usage

The plugin provides a `viking_skill` tool with the following modes:

### List Available Skills

```
/viking_skill mode=list
```

### Load a Specific Skill

```
/viking_skill mode=load name="skill-id"
```

### Search Skills

```
/viking_skill mode=search query="search term"
```

## Development

```bash
bun install    # Install dependencies
bun run build  # Build the plugin
bun run typecheck  # Run type checking
```

## License

MIT
