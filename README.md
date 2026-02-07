```
     ██████╗██╗      █████╗ ██╗    ██╗██████╗ ██████╗  ██████╗ ████████╗
    ██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝
    ██║     ██║     ███████║██║ █╗ ██║██║  ██║██████╔╝██║   ██║   ██║
    ██║     ██║     ██╔══██║██║███╗██║██║  ██║██╔══██╗██║   ██║   ██║
    ╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝██████╔╝╚██████╔╝   ██║
     ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ ╚═════╝  ╚═════╝    ╚═╝

                        ┌─────────────────┐
                        │  ┌───┐   ┌───┐  │
                        │  │ ◉ │   │ ◉ │  │  "beep boop, sending
                        │  └───┘   └───┘  │   to your e-ink display"
                        │                 │
                        │    ╔═══════╗    │
                        │    ║ █████ ║    │
                        │    ╚═══════╝    │
                        └────────┬────────┘
                             ┌───┴───┐
                        ┌────┤ TRMNL ├────┐
                        │    └───────┘    │
                       ╱│╲              ╱│╲
                      ╱ │ ╲            ╱ │ ╲
```

# 🖥️ openclaw-trmnl

TRMNL e-ink display toolkit for [OpenClaw](https://github.com/openclaw/openclaw) AI agents.

## 📦 What's In The Box?

This monorepo contains two packages:

| Package | Description |
|---------|-------------|
| [`trmnl-cli`](./packages/cli) | CLI tool for sending, validating, and tracking TRMNL payloads |
| [`@trmnl/skill`](./packages/skill) | OpenClaw skill for AI agents to control TRMNL displays |

## 🚀 Quick Start

### Install the CLI

```bash
npm install -g trmnl-cli
```

Requires Node.js 22.6.0 or later.

### Configure your webhook

```bash
trmnl config set webhook "https://trmnl.com/api/custom_plugins/YOUR_UUID"
```

### Send content

```bash
# From HTML content
trmnl send --content '<div class="layout">Hello TRMNL!</div>'

# From a file
trmnl send --file ./my-display.html

# Validate first
trmnl validate --file ./my-display.html
```

### View history

```bash
trmnl history           # Last 10 sends
trmnl history --today   # Today's sends
trmnl history --failed  # Failed sends only
```

## 🛠️ CLI Commands

```
trmnl send       Send content to TRMNL display
trmnl validate   Validate payload without sending
trmnl config     Manage webhook URL and settings
trmnl history    View send history with filters
```

See [`packages/cli/README.md`](./packages/cli/README.md) for full documentation.

## 🤖 OpenClaw Skill

The skill teaches AI agents how to generate beautiful TRMNL content using the framework's CSS utilities.

Features:
- Rich layouts (flexbox, grid, columns)
- Typography optimized for e-ink
- Data visualization components
- Automatic payload validation

See [`packages/skill/SKILL.md`](./packages/skill/SKILL.md) for the skill documentation.

## 📁 Data Directory

The CLI stores configuration and history in `~/.trmnl/`:

```
~/.trmnl/
├── config.toml       # Webhook URL, tier settings
└── history.jsonl     # Send history (JSONL format)
```

## ⚡ Tier Limits

| Tier | Payload Size | Rate Limit |
|------|--------------|------------|
| Free | 2 KB | 12 requests/hour |
| TRMNL+ | 5 KB | 30 requests/hour |

Set your tier for accurate validation:
```bash
trmnl tier plus
```

## 🏗️ Development

```bash
# Install dependencies
pnpm install

# Run CLI locally
cd packages/cli
bun run ./src/index.ts --help
```

## 🙏 Credits

- **[TRMNL](https://usetrmnl.com)** - Beautiful e-ink displays
- **[OpenClaw](https://github.com/openclaw/openclaw)** - AI agent framework
- Originally built at ZED x TRMNL Hackathon Berlin 2026 ☕

## 📜 License

MIT
