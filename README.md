# Zeth Code

Zeth Code is a terminal-native AI coding assistant built using SolidJS, SQLite FTS5, and the Bun/Effect runtime. It enables developers to pair program with model agents that have access to local file editing tools, terminal execution, Git repository management, and an advanced persistent memory system.

## Key Features

- **Terminal-Native TUI**: Beautiful and responsive terminal interface with solid layout rendering.
- **Persistent Memory & Reconciler**: Automatic cross-session memory consolidation (`MEMORY.md` rules, checkpoints, gotchas) utilizing SQLite FTS5 lexical ranking.
- **Multiple Specialized Agents**:
  - `build` - Default mode with full tool execution permissions.
  - `plan` - Read-only agent for architectural planning and research.
  - `compose` - Orchestrator mode for running custom skills and composing complex pipelines.
- **Custom Provider Integration**: Connect seamlessly to any OpenAI-compatible API or migration source (e.g. Claude Code configurations).

## Installation & Setup

Ensure you have [Bun](https://bun.sh) installed.

```bash
# Clone the repository
git clone https://github.com/zethcode/zethcode.git
cd zethcode

# Install dependencies
bun install

# Run the development TUI
bun dev
```

## Compilation

Build the single-target executable binary (`zeth`) using the built-in bundler script:

```bash
# Rebuild production CLI executable
bun run --cwd packages/opencode script/build.ts --single
```

The compiled binary will be generated under `packages/opencode/dist/`.

## CLI Usage

```bash
# Start TUI in the current workspace
zeth

# Run Zeth Code with a single message query
zeth run "refactor this index.ts file"

# Manage project or global memory
zeth memory list
zeth memory add "use Bun APIs when possible"
zeth memory search "Bun APIs"
```

## License

MIT License.
