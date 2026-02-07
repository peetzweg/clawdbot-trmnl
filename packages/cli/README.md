# trmnl-cli

CLI tool for [TRMNL](https://usetrmnl.com) e-ink displays. Send, validate, and track payloads.

## Installation

```bash
npm install -g trmnl-cli
```

Requires Node.js 22.6.0 or later.

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

Manage multiple TRMNL displays with named webhooks:

```bash
# Add plugins
trmnl plugin add home "https://trmnl.com/api/custom_plugins/abc123"
trmnl plugin add office "https://trmnl.com/api/custom_plugins/xyz789"

# List plugins
trmnl plugin

# Set default
trmnl plugin default office

# Send to specific plugin
trmnl send --file output.html --plugin home

# Update plugin
trmnl plugin set home --url "https://new-url..."

# Remove plugin
trmnl plugin rm office
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
- `-t, --tier <tier>` - Override tier (`free` or `plus`)
- `--json` - Output result as JSON

### `trmnl plugin`

Manage webhook plugins.

```bash
# List plugins
trmnl plugin

# Add plugin
trmnl plugin add <name> <url>
trmnl plugin add home "https://..." --desc "Living room"

# Update plugin
trmnl plugin set <name> --url "https://..."

# Set default
trmnl plugin default <name>

# Remove plugin
trmnl plugin rm <name>
```

### `trmnl config`

Show configuration.

```bash
trmnl config    # Show all config
```

### `trmnl tier`

Get or set the payload size tier.

```bash
trmnl tier         # Show current tier
trmnl tier plus    # Set tier to plus (5KB limit)
trmnl tier free    # Set tier to free (2KB limit)
```

### `trmnl history`

View send history.

```bash
trmnl history              # Last 10 sends
trmnl history --last 20    # Last N sends
trmnl history --today      # Today's sends
trmnl history --failed     # Failed sends only
trmnl history --plugin home  # Filter by plugin
trmnl history stats        # Statistics
trmnl history clear --confirm  # Clear history
```

## Configuration

### Config File (`~/.trmnl/config.json`)

```json
{
  "plugins": {
    "home": {
      "url": "https://trmnl.com/api/custom_plugins/...",
      "description": "Living room display"
    },
    "office": {
      "url": "https://trmnl.com/api/custom_plugins/..."
    }
  },
  "defaultPlugin": "home",
  "tier": "free"
}
```

### Environment Variables

- `TRMNL_WEBHOOK` - Webhook URL (overrides config, highest priority)

## Tier Limits

| Tier | Payload Limit | Rate Limit |
|------|---------------|------------|
| Free | 2 KB (2,048 bytes) | 12 requests/hour |
| Plus | 5 KB (5,120 bytes) | 30 requests/hour |

Set your tier globally:
```bash
trmnl tier plus
```

## History

Sends are logged to `~/.trmnl/history.jsonl`:

```jsonl
{"timestamp":"2026-02-07T10:00:00Z","plugin":"home","size_bytes":1234,"success":true,...}
```

## License

MIT
