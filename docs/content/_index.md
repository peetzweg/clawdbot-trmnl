# trmnl-cli

CLI tool for [TRMNL](https://usetrmnl.com) e-ink displays. Send, validate, preview, and track payloads — all from your terminal. [View on GitHub](https://github.com/peetzweg/clawdbot-trmnl).

## Install

Install globally via npm:

```
npm install -g trmnl-cli@latest
```

Requires Node.js 22.6.0 or later.

Or run without installing:

```
npx trmnl-cli@latest send --help
```

## Plugins

Manage multiple TRMNL displays with named webhooks:

```
# Add your first plugin
trmnl plugin add home "https://trmnl.com/api/custom_plugins/YOUR_UUID"

# Add more plugins
trmnl plugin add office "https://trmnl.com/api/custom_plugins/xyz789"

# List all plugins
trmnl plugin

# Set a default
trmnl plugin default home

# Remove a plugin
trmnl plugin rm office
```

## Send

Send content to your TRMNL display.

```
# Direct HTML content
trmnl send --content '<div class="layout">Hello TRMNL!</div>'

# From a file
trmnl send --file ./output.html

# To a specific plugin
trmnl send --file ./output.html --plugin office

# From stdin (piped)
echo '{"merge_variables":{"content":"..."}}' | trmnl send
```

### Options

| Flag | Description |
|------|-------------|
| `-c, --content <html>` | HTML content to send |
| `-f, --file <path>` | Read content from file |
| `-p, --plugin <name>` | Plugin to use (default: default plugin) |
| `-w, --webhook <url>` | Override webhook URL directly |
| `--skip-validation` | Skip payload validation |
| `--skip-log` | Don't log to history |
| `--json` | Output result as JSON |

## Validate

Validate a payload without sending it. Checks size against your tier limit.

```
trmnl validate --file ./output.html
trmnl validate --content "..." --tier plus
```

### Options

| Flag | Description |
|------|-------------|
| `-c, --content <html>` | HTML content to validate |
| `-f, --file <path>` | Read content from file |
| `-t, --tier <tier>` | Override tier (`free` or `plus`) |
| `--json` | Output result as JSON |

## Config

Show your current configuration.

```
trmnl config
```

## Tier

Get or set the payload size tier.

```
trmnl tier         # Show current tier
trmnl tier plus    # Set to plus (5KB limit)
trmnl tier free    # Set to free (2KB limit)
```

### Tier limits

| Tier | Payload Limit | Rate Limit |
|------|---------------|------------|
| Free | 2 KB (2,048 bytes) | 12 requests/hour |
| Plus | 5 KB (5,120 bytes) | 30 requests/hour |

## History

View send history with filters.

```
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

```
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
