# trmnl-cli

[![npm](https://img.shields.io/npm/v/trmnl-cli)](https://www.npmjs.com/package/trmnl-cli)

CLI for [TRMNL](https://usetrmnl.com) e-ink displays. Send, validate, preview, and track payloads from your terminal.

[Documentation](https://peetzweg.github.io/clawdbot-trmnl/) · [npm](https://www.npmjs.com/package/trmnl-cli)

## Install

```sh
npm install -g trmnl-cli@latest
```

Requires Node.js 22.6.0 or later. Or run without installing:

```sh
npx trmnl-cli@latest send --help
```

## Quick Start

```sh
# Add your first plugin (webhook)
trmnl plugin add home "https://trmnl.com/api/custom_plugins/YOUR_UUID"

# Send content
trmnl send --content '<div class="layout">Hello TRMNL!</div>'

# Or from a file
trmnl send --file ./output.html
```

## Commands

### `trmnl send`

Send content to your TRMNL display.

```sh
# Direct content
trmnl send --content '<div class="layout">Hello</div>'

# From file
trmnl send --file ./output.html

# To a specific plugin
trmnl send --file ./output.html --plugin office

# From stdin
echo '{"merge_variables":{"content":"..."}}' | trmnl send
```

| Flag | Description |
|------|-------------|
| `-c, --content <html>` | HTML content to send |
| `-f, --file <path>` | Read content from file |
| `-p, --plugin <name>` | Plugin to use (default: default plugin) |
| `-w, --webhook <url>` | Override webhook URL directly |
| `--skip-validation` | Skip payload validation |
| `--skip-log` | Don't log to history |
| `--json` | Output result as JSON |

### `trmnl validate`

Validate a payload without sending. Checks size against your tier limit.

```sh
trmnl validate --file ./output.html
trmnl validate --content "..." --tier plus
```

| Flag | Description |
|------|-------------|
| `-c, --content <html>` | HTML content to validate |
| `-f, --file <path>` | Read content from file |
| `-t, --tier <tier>` | Override tier (`free` or `plus`) |
| `--json` | Output result as JSON |

### `trmnl preview`

Render content locally using the actual TRMNL framework and take a screenshot. Useful for checking layout, overflow, and visual appearance before sending to a device.

Requires Playwright. Install browsers once with `npx playwright install chromium`.

```sh
# Preview a file
trmnl preview --file ./output.html

# Preview and open in default viewer
trmnl preview --file ./output.html --open

# Preview for a specific device
trmnl preview --file ./output.html --device v2

# From stdin
echo '<div class="layout">Hello</div>' | trmnl preview
```

| Flag | Description |
|------|-------------|
| `-c, --content <html>` | HTML content to preview |
| `-f, --file <path>` | Read content from file |
| `-o, --output <path>` | Screenshot output path |
| `--open` | Open screenshot in default viewer |
| `--device <id>` | Device profile: `og`, `v2`, `x` (default: `og`) |
| `--no-overflow-check` | Skip overflow detection |
| `--update-framework` | Force-update cached TRMNL framework before rendering |
| `--json` | Output result as JSON |

Device profiles:

| Device | Resolution | Bit depth |
|--------|------------|-----------|
| `og` | 800 x 480 | 2-bit |
| `v2` | 1040 x 780 | 4-bit |
| `x` | 1872 x 1404 | 4-bit |

The exit code is `1` if overflow is detected, `0` otherwise.

### `trmnl framework`

Manage the cached TRMNL CSS/JS framework used by `preview`.

```sh
trmnl framework status    # Show cached framework info
trmnl framework update    # Fetch latest from CDN
trmnl framework check     # Check if an update is available
```

### `trmnl plugin`

Manage webhook plugins. Each plugin is a named reference to a TRMNL custom plugin webhook URL.

```sh
# List plugins
trmnl plugin

# Add a plugin
trmnl plugin add home "https://trmnl.com/api/custom_plugins/abc123"
trmnl plugin add office "https://trmnl.com/api/custom_plugins/xyz789" --desc "Office display"

# Set default
trmnl plugin default home

# Update a plugin
trmnl plugin set home --url "https://..."

# Remove a plugin
trmnl plugin rm office
```

### `trmnl config`

Show current configuration: plugins, tier, history path, and environment variables.

```sh
trmnl config
```

### `trmnl tier`

Get or set the payload size tier.

```sh
trmnl tier         # Show current tier
trmnl tier plus    # Set to plus (5 KB limit)
trmnl tier free    # Set to free (2 KB limit)
```

### `trmnl history`

View and filter send history.

```sh
trmnl history              # Last 10 sends
trmnl history --last 20    # Last N sends
trmnl history --today      # Today's sends
trmnl history --failed     # Failed sends only
trmnl history --plugin home  # Filter by plugin
trmnl history stats        # Statistics
trmnl history clear --confirm  # Clear history
```

## Configuration

### Config file

Settings are stored in `~/.trmnl/config.json`:

```json
{
  "plugins": {
    "home": {
      "url": "https://trmnl.com/api/custom_plugins/...",
      "description": "Living room display"
    }
  },
  "defaultPlugin": "home",
  "tier": "free"
}
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `TRMNL_WEBHOOK` | Webhook URL (overrides config, highest priority) |

### Data directory

All data is stored in `~/.trmnl/`:

| File | Description |
|------|-------------|
| `config.json` | Plugin and tier configuration |
| `history.jsonl` | Send history (one JSON entry per line) |

## Tier limits

| Tier | Payload limit | Rate limit |
|------|---------------|------------|
| Free | 2 KB (2,048 bytes) | 12 requests/hour |
| Plus | 5 KB (5,120 bytes) | 30 requests/hour |

## License

MIT
