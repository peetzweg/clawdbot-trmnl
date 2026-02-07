# trmnl-cli

CLI tool for [TRMNL](https://usetrmnl.com) e-ink displays. Send, validate, and track payloads.

## Installation

```bash
# With bun (recommended)
bun install -g trmnl-cli

# With npm
npm install -g trmnl-cli
```

## Quick Start

```bash
# Add your first plugin (webhook)
trmnl plugin add home "https://trmnl.com/api/custom_plugins/YOUR_UUID"

# Send content
trmnl send --content '<div class="layout">Hello TRMNL!</div>'

# Or from a file
trmnl send --file ./output.html
```

## Plugins

Manage multiple TRMNL displays/plugins with named webhooks:

```bash
# Add plugins
trmnl plugin add home "https://trmnl.com/api/custom_plugins/abc123"
trmnl plugin add office "https://trmnl.com/api/custom_plugins/xyz789" --tier plus

# List plugins
trmnl plugin list

# Set default
trmnl plugin default office

# Send to specific plugin
trmnl send --file output.html --plugin home

# Update plugin
trmnl plugin update home --tier plus

# Remove plugin
trmnl plugin remove office
```

## Commands

### `trmnl send`

Send content to your TRMNL display.

```bash
# Direct content
trmnl send --content "<div class=\"layout\">Hello</div>"

# From file
trmnl send --file ./output.html

# To specific plugin
trmnl send --file ./output.html --plugin office

# From stdin (piped)
echo '{"merge_variables":{"content":"..."}}' | trmnl send

# With options
trmnl send --file output.html --skip-validation --json
```

Options:
- `-c, --content <html>` - HTML content to send
- `-f, --file <path>` - Read content from file
- `-p, --plugin <name>` - Plugin to use (default: default plugin)
- `-w, --webhook <url>` - Override webhook URL directly
- `--skip-validation` - Skip payload validation
- `--skip-log` - Don't log to history
- `--json` - Output result as JSON

### `trmnl validate`

Validate a payload without sending.

```bash
trmnl validate --file ./output.html
trmnl validate --content "..." --tier plus
```

Options:
- `-c, --content <html>` - HTML content to validate
- `-f, --file <path>` - Read content from file
- `-t, --tier <tier>` - Check against tier limit (`free` or `plus`)
- `--json` - Output result as JSON

### `trmnl plugin`

Manage webhook plugins.

```bash
# List plugins
trmnl plugin list
trmnl plugins

# Add plugin
trmnl plugin add <name> <url> [options]
  -t, --tier <tier>       Tier (free or plus)
  -d, --description <desc> Plugin description
  --default               Set as default plugin

# Update plugin
trmnl plugin update <name> [options]
  -u, --url <url>         New webhook URL
  -t, --tier <tier>       Tier (free or plus)
  -d, --description <desc> Plugin description

# Set default
trmnl plugin default <name>

# Remove plugin
trmnl plugin remove <name>
```

### `trmnl config`

Show configuration.

```bash
trmnl config        # Show all config
trmnl config path   # Show config file path
```

### `trmnl history`

View send history.

```bash
# Last 10 sends
trmnl history

# Last N sends
trmnl history --last 20

# Filter
trmnl history --today
trmnl history --failed
trmnl history --success
trmnl history --plugin office

# Stats
trmnl history stats

# Clear
trmnl history clear --confirm
```

Options:
- `-n, --last <n>` - Show last N entries (default: 10)
- `--today` - Show only today's entries
- `--failed` - Show only failed sends
- `--success` - Show only successful sends
- `-p, --plugin <name>` - Filter by plugin name
- `-v, --verbose` - Show content preview
- `--json` - Output as JSON

## Configuration

### Config File (`~/.trmnl/config.json`)

```json
{
  "plugins": {
    "home": {
      "url": "https://trmnl.com/api/custom_plugins/...",
      "tier": "free",
      "description": "Living room display"
    },
    "office": {
      "url": "https://trmnl.com/api/custom_plugins/...",
      "tier": "plus"
    }
  },
  "defaultPlugin": "home",
  "history": {
    "path": "~/.trmnl/history.jsonl",
    "maxSizeMb": 100
  }
}
```

### Environment Variables

- `TRMNL_WEBHOOK` - Webhook URL (overrides config, highest priority)

## History Format

Sends are logged to `~/.trmnl/history.jsonl`:

```jsonl
{"timestamp":"2026-02-07T10:00:00Z","plugin":"home","size_bytes":1234,"tier":"free","payload":{...},"success":true,"status_code":200,"duration_ms":234}
```

## Tier Limits

| Tier | Payload Limit | Rate Limit |
|------|---------------|------------|
| Free | 2 KB (2,048 bytes) | 12 requests/hour |
| Plus | 5 KB (5,120 bytes) | 30 requests/hour |

## License

MIT
