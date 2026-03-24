# trmnl-cli

[![npm](https://img.shields.io/npm/v/trmnl-cli)](https://www.npmjs.com/package/trmnl-cli)

CLI toolkit for [TRMNL](https://usetrmnl.com) e-ink displays. Send, validate, preview, and track payloads — all from your terminal.

[Documentation](https://peetzweg.github.io/clawdbot-trmnl/) · [npm](https://www.npmjs.com/package/trmnl-cli)

## Install

```sh
npm install -g trmnl-cli@latest
```

Requires Node.js 22.6.0 or later. Or run without installing:

```sh
npx trmnl-cli@latest --help
```

## Quick Start

```sh
# 1. Register a webhook plugin
trmnl plugin add home "https://trmnl.com/api/custom_plugins/YOUR_UUID"

# 2. Send content to your display
trmnl send --content '<div class="layout">Hello TRMNL!</div>'

# 3. Or send from a file
trmnl send --file ./output.html

# 4. Preview locally before sending (requires Playwright)
trmnl preview --file ./output.html --open
```

## Commands

| Command | Description |
|---------|-------------|
| `trmnl send` | Send content to a TRMNL display |
| `trmnl validate` | Validate payload size without sending |
| `trmnl preview` | Render and screenshot content locally |
| `trmnl framework` | Manage cached TRMNL CSS/JS framework |
| `trmnl plugin` | Add, remove, and manage webhook plugins |
| `trmnl config` | Show current configuration |
| `trmnl tier` | Get or set payload size tier (free/plus) |
| `trmnl history` | View and filter send history |

See the [CLI README](./packages/cli/README.md) for the full command reference.

## Packages

This is a pnpm monorepo. Only `trmnl-cli` is published to npm.

| Directory | Package | Description |
|-----------|---------|-------------|
| `packages/cli` | [`trmnl-cli`](https://www.npmjs.com/package/trmnl-cli) | CLI tool (published to npm) |
| `packages/renderer` | `trmnl-renderer` | Screen renderer for local preview (bundled into CLI at build time) |
| `packages/skill` | — | Reference docs for AI-assisted content generation |

## Development

```sh
pnpm install
pnpm run build
pnpm -r test
```

Run the CLI from source:

```sh
cd packages/cli
pnpm run dev -- send --help
```

## Contributing

1. Fork and create a feature branch
2. Make your changes
3. Add a changeset: `pnpm changeset`
4. Open a pull request

See [RELEASE.md](./RELEASE.md) for the full release process.

## License

MIT
