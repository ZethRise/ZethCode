# Zeth Code

<p align="center">
  <a href="https://github.com/ZethRise/ZethCode/releases/latest"><img alt="release" src="https://img.shields.io/github/v/release/ZethRise/ZethCode?label=release&logo=github&color=0b9bd7"></a>
  <a href="https://github.com/ZethRise/ZethCode/releases"><img alt="downloads" src="https://img.shields.io/github/downloads/ZethRise/ZethCode/total?label=downloads&logo=github&color=42c900"></a>
  <a href="https://github.com/ZethRise/ZethCode/actions/workflows/build.yml"><img alt="release build" src="https://img.shields.io/github/actions/workflow/status/ZethRise/ZethCode/build.yml?branch=master&label=release&logo=github&color=42c900"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/github/license/ZethRise/ZethCode?label=license&logo=github"></a>
  <a href="https://github.com/ZethRise/ZethCode/stargazers"><img alt="stars" src="https://img.shields.io/github/stars/ZethRise/ZethCode?label=Stars&logo=github"></a>
</p>

<p align="center"><strong>Terminal-native AI coding assistant for local developer workflows.</strong></p>

<p align="center">
  English | <a href="./README.fa.md">فارسی</a>
</p>

Zeth Code is a fork of [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code), adapted under the ZethRise namespace with Windows release builds and the `zeth` command. It keeps the terminal-first agent workflow: read and edit code, run commands, manage Git, preserve project memory across sessions, and connect to OpenAI-compatible model providers.

MiMo Code is built as a fork of [OpenCode](https://github.com/anomalyco/opencode). Zeth Code Fixes the issues with MiMo Code and added a few new features!

---

## What's New in v1.0.5

- More reliable TUI streaming: buffered out-of-order text deltas so assistant messages stop randomly disappearing mid-stream.
- Better Persian/RTL handling in the prompt and message bubbles, including safer wrapping when Persian and English text are mixed.
- AgentRouter compatibility fix: billing summary SSE events are ignored before they reach the model stream parser.
- `/context` now scrolls and shows user/assistant token breakdown, plus total visible messages.
- New `/search` command for jumping to matching text inside the current session.
- Skill loading now respects `disable-model-invocation: true`, keeping manual-only skills out of model-visible skill lists.
- Windows terminal paste is more reliable through `ENABLE_VIRTUAL_TERMINAL_INPUT`, improving Ctrl+V and bracketed paste behavior.
- Sidebar now shows live agent status and the latest tool activity.

---

## Quick Start

Install with npm:

```bash
npm install -g @zethrise/cli
zeth
```

Install on Windows with PowerShell:

```powershell
irm https://raw.githubusercontent.com/ZethRise/ZethCode/master/install.ps1 | iex
```

Install on Linux/macOS with curl:

```bash
curl -fsSL https://raw.githubusercontent.com/ZethRise/ZethCode/master/scripts/install | bash
```

Or download a standalone Windows executable from the [releases page](https://github.com/ZethRise/ZethCode/releases/latest):

| Build | Use when |
|-------|----------|
| `zethcode-windows-x64.exe` | Most modern Intel/AMD Windows PCs |
| `zethcode-windows-x64-baseline.exe` | Older x64 CPUs without newer instruction support |
| `zethcode-windows-arm64.exe` | Windows on ARM devices |

Run it from a terminal inside your project:

```powershell
.\zethcode-windows-x64.exe
```

### Linux

Download a `.deb` or `.AppImage` from the [releases page](https://github.com/ZethRise/ZethCode/releases/latest):

| Build | Use when |
|-------|----------|
| `zethcode-linux-x64.deb` / `.AppImage` | Most modern Intel/AMD Linux PCs |
| `zethcode-linux-arm64.deb` / `.AppImage` | Linux on ARM (e.g. Raspberry Pi 5, ARM servers) |

Install the `.deb`:

```bash
sudo dpkg -i zethcode-linux-x64.deb
zeth
```

Or run the `.AppImage` (no root needed):

```bash
chmod +x zethcode-linux-x64.AppImage
./zethcode-linux-x64.AppImage
```

For development from source:

```bash
git clone https://github.com/ZethRise/ZethCode.git
cd ZethCode
bun install
bun dev
```

---

## Core Features

### Terminal-Native TUI

Zeth Code runs in the terminal and is built for coding sessions where the agent needs real project context, file access, shell access, and Git awareness.

### Multiple Agents

| Agent | Description |
|-------|-------------|
| `build` | Default development agent with tool execution |
| `plan` | Read-only analysis mode for exploration and architecture |
| `compose` | Orchestration mode for skill-driven and structured workflows |

### Persistent Memory

Project memory keeps useful context across sessions:

- Project rules and architecture notes
- Session checkpoints
- Gotchas and repeated fixes
- Task progress
- Searchable local context backed by SQLite FTS5
- Health checks, reindexing, and a TUI memory trace view

### Local Development Tools

Agents can inspect files, edit code, run commands, work with Git state, and use project context directly from the current workspace.

### Provider Support

Use OpenAI-compatible providers and imported model configurations. Zeth Code keeps provider and model selection in the TUI so you can switch workflows without leaving the terminal.

### Built-in MCP Servers

Zeth Code includes built-in project memory MCP support and Context7 MCP support for documentation-aware coding sessions.

### Context Controls

Use the TUI context tools to inspect token usage, review attached context, and trim stale files or messages without restarting the session.

### Workflows and Skills

Zeth Code includes the workflow and skill architecture inherited from MiMo Code, including structured development flows, compose-style orchestration, and reusable task instructions.

---

## CLI Usage

```bash
# Start the TUI in the current workspace
zeth

# Run a single prompt
zeth run "refactor this module and explain the change"

# Start without a local project folder
zeth --no-project
zeth run --no-project "research this API and make a plan"

# Manage memory
zeth memory list
zeth memory add "prefer Bun APIs in this repository"
zeth memory search "Bun APIs"
zeth memory health
zeth memory reindex

# Scaffold a connector
zeth connector create my-connector
```

---

## Development

```bash
bun install              # Install dependencies
bun dev                  # Run development TUI
bun turbo typecheck      # Type check all packages
```

Build a local single-target executable:

```bash
bun run --cwd packages/opencode script/build.ts --single
```

Release builds are generated by `.github/workflows/build.yml`, including Windows `.exe` files and Linux `.deb`/`.AppImage` files.

---

## Relationship to MiMo Code

Zeth Code is a fork of [XiaomiMiMo/MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code). Credit goes to the MiMo Code project for the core terminal agent system, persistent memory architecture, workflows, skills, provider support, and TUI foundation.

---

## License

Source code is licensed under the [MIT License](./LICENSE).

Use of this project is also subject to the [Use Restrictions](./USE_RESTRICTIONS.md).
