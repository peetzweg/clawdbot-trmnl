# TRMNL CLI + Skill Architecture Plan

## 🎯 Vision

Transform openclaw-trmnl into a professional, reusable toolkit:
- **CLI tool** (`trmnl`) for sending, validating, and tracking payloads
- **OpenClaw skill** that leverages the CLI for agent interactions
- **Clean separation** between tool (CLI) and agent interface (skill)

## 🏗️ Architecture

### Monorepo Structure (pnpm workspace)

```
openclaw-trmnl/
├── pnpm-workspace.yaml
├── package.json (root)
├── packages/
│   ├── cli/                    # @trmnl/cli - The CLI tool
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts        # CLI entry point (bun + cac)
│   │   │   ├── commands/
│   │   │   │   ├── send.ts     # Send content to TRMNL
│   │   │   │   ├── history.ts  # View send history
│   │   │   │   ├── validate.ts # Check payload size
│   │   │   │   └── config.ts   # Manage ~/.trmnl/config.toml
│   │   │   ├── lib/
│   │   │   │   ├── webhook.ts  # Webhook sending logic
│   │   │   │   ├── logger.ts   # JSONL history writer
│   │   │   │   ├── validator.ts # Payload size checker
│   │   │   │   └── config.ts   # Config file handler
│   │   │   └── types.ts
│   │   ├── bin/
│   │   │   └── trmnl           # Executable shim
│   │   └── README.md
│   │
│   └── skill/                  # @trmnl/skill - OpenClaw skill
│       ├── SKILL.md
│       ├── references/         # Existing framework docs
│       │   ├── patterns.md
│       │   ├── framework-overview.md
│       │   ├── css-utilities.md
│       │   ├── layout-systems.md
│       │   ├── components.md
│       │   └── webhook-api.md
│       └── assets/
│           └── good-examples/  # HTML templates
│
├── markup.html                 # Legacy template (keep for reference)
├── working.html               # Legacy template (keep for reference)
└── README.md                  # Project overview
```

## 📦 CLI Design (`trmnl`)

### Commands

```bash
# Send content
trmnl send --content "<div>...</div>"
trmnl send --file ./output.html
echo '{"merge_variables":{...}}' | trmnl send

# View history
trmnl history                  # Last 10 sends
trmnl history --last 20        # Last N sends
trmnl history --today          # Today's sends
trmnl history --failed         # Failed sends only
trmnl history --json           # Raw JSONL output

# Validate payload
trmnl validate --file ./output.html
echo '{"merge_variables":{...}}' | trmnl validate

# Config management
trmnl config set webhook "https://trmnl.com/api/custom_plugins/{uuid}"
trmnl config get webhook
trmnl config list
```

### Configuration (`~/.trmnl/config.toml`)

```toml
[webhook]
url = "https://trmnl.com/api/custom_plugins/{uuid}"
tier = "free"  # "free" or "plus" (determines size limits)

[history]
path = "~/.trmnl/history.jsonl"
max_size_mb = 100  # Auto-rotate when exceeded

[validation]
strict = false  # If true, fail on warnings (not just errors)
```

### History Format (`~/.trmnl/history.jsonl`)

```jsonl
{"timestamp":"2026-02-07T10:00:00Z","size_bytes":1234,"tier":"free","payload":{"merge_variables":{...}},"success":true,"status_code":200,"response":"OK","duration_ms":234}
{"timestamp":"2026-02-07T10:05:00Z","size_bytes":2048,"tier":"free","payload":{"merge_variables":{...}},"success":true,"status_code":200,"response":"OK","duration_ms":189}
{"timestamp":"2026-02-07T10:10:00Z","size_bytes":2500,"tier":"free","payload":{"merge_variables":{...}},"success":false,"status_code":413,"error":"Payload too large","duration_ms":102}
```

## 🤖 Skill Design

### SKILL.md Structure

**Frontmatter:**
```yaml
---
name: trmnl
description: Generate content for TRMNL e-ink display devices using the TRMNL CSS framework and send via the trmnl CLI. Use when the user wants to display information on their TRMNL device, send messages to an e-ink display, create dashboard content, show notifications, or update their terminal display. Supports rich layouts with the TRMNL framework (flexbox, grid, tables, progress bars, typography utilities).
---
```

**Body sections:**
1. **Quick Start** - Workflow using the `trmnl` CLI
2. **CLI Commands** - How to use `trmnl send`, `trmnl validate`, `trmnl history`
3. **Framework Reference** - When to read which reference file
4. **Variable Naming** - Clear conventions for content structure
5. **Best Practices** - Size optimization, validation workflow
6. **Troubleshooting** - Common issues and solutions

### Key Changes from Current Skill

**Before (direct curl):**
```bash
cat > /tmp/trmnl.json << 'EOF'
{"merge_variables":{"content":"<div>HTML</div>"}}
EOF
curl "$TRMNL_WEBHOOK" -H "Content-Type: application/json" -d @/tmp/trmnl.json
```

**After (CLI):**
```bash
trmnl send --content "<div>HTML</div>"
# or
trmnl send --file ./output.html
```

**Benefits:**
- ✅ Automatic validation before sending
- ✅ Automatic history logging
- ✅ Clear error messages
- ✅ No temp file management
- ✅ Enforced variable naming
- ✅ Built-in payload size checking

## 🔧 Implementation Stack

### CLI (`packages/cli`)
- **Runtime:** Bun (fast, TypeScript-native)
- **CLI Framework:** cac (lightweight, powerful)
- **Config:** toml (human-friendly)
- **HTTP:** node:http or fetch (built-in)
- **Validation:** Custom size checker (inspired by existing check_payload.py)

### Skill (`packages/skill`)
- **Format:** OpenClaw skill package
- **References:** Existing markdown docs (no changes needed)
- **Assets:** Existing templates (no changes needed)

## 🚀 Implementation Phases

### Phase 1: CLI Foundation ✨
1. Set up pnpm workspace
2. Create `@trmnl/cli` package
3. Implement core commands:
   - `trmnl send`
   - `trmnl validate`
   - `trmnl config`
4. Config file handling (~/.trmnl/config.toml)
5. JSONL history logging
6. Basic testing

### Phase 2: CLI Polish 💎
1. Implement `trmnl history` with filters
2. Better error messages
3. Progress indicators for sends
4. Support for piped input
5. Auto-config wizard (first run)

### Phase 3: Skill Migration 📦
1. Update SKILL.md to use CLI
2. Remove direct curl instructions
3. Add CLI command examples
4. Document variable naming conventions
5. Package as .skill file

### Phase 4: Developer Experience 🎨
1. Add `trmnl init` for project templates
2. Add `trmnl dev` for local preview (optional)
3. Shell completions (bash/zsh)
4. Better validation messages

## 📊 Success Criteria

- ✅ CLI installs globally: `bun install -g @trmnl/cli`
- ✅ One-command send: `trmnl send --file output.html`
- ✅ Full send history: `trmnl history`
- ✅ Clear validation: `trmnl validate --file output.html`
- ✅ Agent uses CLI: SKILL.md references `trmnl` commands
- ✅ Automatic logging: Every send tracked in ~/.trmnl/history.jsonl
- ✅ Zero temp files: No more /tmp/trmnl.json management

## 🎯 Key Design Decisions

### Why CLI over Scripts?

**Scripts approach:**
- ❌ Harder to maintain (bash/python mix)
- ❌ Poor error handling
- ❌ No structured config
- ❌ Hard to test
- ❌ No cross-platform guarantees

**CLI approach:**
- ✅ Single codebase (TypeScript)
- ✅ Structured commands + help text
- ✅ Proper config management
- ✅ Easy to test
- ✅ Cross-platform (bun)
- ✅ Professional UX

### Why Monorepo?

**Benefits:**
- ✅ CLI and skill share version history
- ✅ Easy to test skill changes with CLI
- ✅ Single source of truth for patterns
- ✅ Can extract shared types if needed

**Structure:**
- `packages/cli` - Standalone tool (globally installable)
- `packages/skill` - OpenClaw skill package
- Both independently versioned, but developed together

### Why Bun + cac?

**Bun:**
- ✅ Fast startup (important for CLI)
- ✅ TypeScript-native (no compilation needed)
- ✅ Built-in fetch, file APIs
- ✅ Small binary (easy distribution)

**cac:**
- ✅ Lightweight (~5KB)
- ✅ Powerful (subcommands, options, validation)
- ✅ Great DX (auto-help, type-safe)
- ✅ Battle-tested (used by Vite, etc.)

### Why ~/.trmnl Directory?

**Standard CLI pattern:**
- Config: `~/.trmnl/config.toml`
- History: `~/.trmnl/history.jsonl`
- Cache: `~/.trmnl/cache/` (future)

**Benefits:**
- ✅ User-owned data
- ✅ Easy to backup/sync
- ✅ Easy to inspect/debug
- ✅ Follows CLI conventions

## 🔮 Future Enhancements

### CLI
- `trmnl preview` - Local HTTP server with live reload
- `trmnl templates` - Built-in template gallery
- `trmnl compress` - Minify HTML for size limits
- `trmnl diff` - Compare current vs last send
- `trmnl stats` - Analytics on send history

### Skill
- Asset library for common patterns
- Schema validation for merge_variables
- Auto-optimization for payload size
- Template suggestions based on content type

## 📝 Documentation Strategy

### CLI README
- Installation instructions
- Quick start guide
- Command reference
- Configuration options
- Examples

### Skill SKILL.md
- Agent workflow (high-level)
- CLI command usage
- When to read reference docs
- Variable naming conventions
- Best practices

### Project README
- Architecture overview
- Development setup
- Contributing guide
- Links to CLI + Skill docs

---

**Next Step:** Implement Phase 1 - CLI Foundation ✨
