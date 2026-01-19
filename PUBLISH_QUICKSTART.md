# Quick Start: Publishing Your Plugin

## Step 1: Prepare

```bash
cd /Users/bytedance/work/space/python/opencode-skill-plugin

# Update version in package.json (if needed)
bun run build      # Build the plugin
bun run typecheck  # Run type check
```

## Step 2: Publish

```bash
npm login   # Login to npm (if needed)
npm publish # Publish the package

# For scoped packages: npm publish --access public
```

## Step 3: Verify

```bash
npm view opencode-viking-skill-plugin

# Or visit: https://www.npmjs.com/package/opencode-viking-skill-plugin
```

## Step 4: Install

Users can install the plugin:

```bash
# Method 1: Automatic installation
bunx opencode-viking-skill-plugin@latest install

# Method 2: Manual configuration
# Add to ~/.config/opencode/opencode.jsonc:
{
  "plugin": ["opencode-viking-skill-plugin"]
}
```

## Done! 🎉

Your plugin is now published and ready to use.

---

## Need Help?

- See [PUBLISHING.md](./PUBLISHING.md) for detailed instructions
- Test locally with `file://` protocol first
- Check [npm documentation](https://docs.npmjs.com/)
