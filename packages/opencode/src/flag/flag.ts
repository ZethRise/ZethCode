import { Config } from "effect"

function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

function falsy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "false" || value === "0"
}

function number(key: string) {
  const value = process.env[key]
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function nonNegativeNumber(key: string) {
  const value = process.env[key]
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}

const ZETHCODE_EXPERIMENTAL = truthy("ZETHCODE_EXPERIMENTAL")

// Defaults to false. When enabled, zethcode runs in pure-mimo mode:
//   — does NOT inherit Claude Code's settings (CLAUDE.md, ~/.claude/skills, etc.)
//   — does NOT pick up provider API keys from environment variables
//   — falls back to the mimo-auto model as the default
// Set ZETHCODE_MIMO_ONLY=true to disable .claude inheritance and env-based
// provider auto-detection.
const ZETHCODE_MIMO_ONLY = truthy("ZETHCODE_MIMO_ONLY")
const ZETHCODE_DISABLE_CLAUDE_CODE_ENV = truthy("ZETHCODE_DISABLE_CLAUDE_CODE")
const ZETHCODE_DISABLE_CLAUDE_CODE = ZETHCODE_MIMO_ONLY || ZETHCODE_DISABLE_CLAUDE_CODE_ENV

const ZETHCODE_DISABLE_EXTERNAL_SKILLS = truthy("ZETHCODE_DISABLE_EXTERNAL_SKILLS")
const ZETHCODE_DISABLE_CLAUDE_CODE_SKILLS =
  ZETHCODE_DISABLE_EXTERNAL_SKILLS || ZETHCODE_DISABLE_CLAUDE_CODE || truthy("ZETHCODE_DISABLE_CLAUDE_CODE_SKILLS")
const copy = process.env["ZETHCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  ZETHCODE_AUTO_SHARE: truthy("ZETHCODE_AUTO_SHARE"),
  ZETHCODE_AUTO_HEAP_SNAPSHOT: truthy("ZETHCODE_AUTO_HEAP_SNAPSHOT"),
  ZETHCODE_GIT_BASH_PATH: process.env["ZETHCODE_GIT_BASH_PATH"],
  ZETHCODE_CONFIG: process.env["ZETHCODE_CONFIG"],
  ZETHCODE_CONFIG_CONTENT: process.env["ZETHCODE_CONFIG_CONTENT"],

  ZETHCODE_DISABLE_AUTOUPDATE: truthy("ZETHCODE_DISABLE_AUTOUPDATE"),

  // Defaults to false (rotation enabled). When enabled, the active log file is
  // never archived to <name>.log.<stamp> on hitting MAX_FILE_SIZE — it grows in
  // place. Useful when an external tool tails/manages the single log file.
  ZETHCODE_DISABLE_LOG_ROTATION: truthy("ZETHCODE_DISABLE_LOG_ROTATION"),

  // Defaults to true (analytics enabled). Set ZETHCODE_ENABLE_ANALYSIS=false
  // to opt out of POSTing model_call/tool_call/agent_request metrics.
  ZETHCODE_ENABLE_ANALYSIS: !falsy("ZETHCODE_ENABLE_ANALYSIS"),
  ZETHCODE_ALWAYS_NOTIFY_UPDATE: truthy("ZETHCODE_ALWAYS_NOTIFY_UPDATE"),
  ZETHCODE_DISABLE_PRUNE: truthy("ZETHCODE_DISABLE_PRUNE"),
  ZETHCODE_DISABLE_TERMINAL_TITLE: truthy("ZETHCODE_DISABLE_TERMINAL_TITLE"),
  ZETHCODE_SHOW_TTFD: truthy("ZETHCODE_SHOW_TTFD"),
  ZETHCODE_PERMISSION: process.env["ZETHCODE_PERMISSION"],

  // Defaults to false. When false, the bash tool intercepts irreversible
  // deletion commands (rm, rmdir, unlink, shred, del, erase, rd, remove-item,
  // and git destructive subcommands like reset --hard / clean -f / branch -D /
  // worktree remove / push --force / stash drop|clear / tag -d) and forces an
  // extra permission prompt with permission="bash_delete" — separate from the
  // normal bash-permission ask so it can't be silently pre-approved by a broad
  // `bash: allow` rule. Set ZETHCODE_AUTO_APPROVE_DELETE=true to trust the
  // model with deletes and skip the second confirmation.
  ZETHCODE_AUTO_APPROVE_DELETE: truthy("ZETHCODE_AUTO_APPROVE_DELETE"),
  // Set by the TUI's --dangerously-skip-permissions flag. When truthy, an
  // allow-all base ruleset is injected UNDER the user's config permission so
  // every tool auto-approves unless the user explicitly denied it.
  ZETHCODE_DANGEROUSLY_SKIP_PERMISSIONS: truthy("ZETHCODE_DANGEROUSLY_SKIP_PERMISSIONS"),
  ZETHCODE_DISABLE_DEFAULT_PLUGINS: truthy("ZETHCODE_DISABLE_DEFAULT_PLUGINS"),
  ZETHCODE_DISABLE_LSP_DOWNLOAD: truthy("ZETHCODE_DISABLE_LSP_DOWNLOAD"),
  ZETHCODE_ENABLE_EXPERIMENTAL_MODELS: truthy("ZETHCODE_ENABLE_EXPERIMENTAL_MODELS"),
  ZETHCODE_DISABLE_AUTOCOMPACT: truthy("ZETHCODE_DISABLE_AUTOCOMPACT"),
  ZETHCODE_DISABLE_MODELS_FETCH: truthy("ZETHCODE_DISABLE_MODELS_FETCH"),
  ZETHCODE_DISABLE_MOUSE: truthy("ZETHCODE_DISABLE_MOUSE"),
  ZETHCODE_OUTPUT_LENGTH_CONTINUATION_LIMIT: number("ZETHCODE_OUTPUT_LENGTH_CONTINUATION_LIMIT") ?? 3,
  ZETHCODE_INVALID_OUTPUT_CONTINUATION_LIMIT: number("ZETHCODE_INVALID_OUTPUT_CONTINUATION_LIMIT") ?? 2,
  ZETHCODE_TEXT_TOOL_CALL_RETRY_LIMIT: number("ZETHCODE_TEXT_TOOL_CALL_RETRY_LIMIT") ?? 2,

  // Consecutive-block repetition detection for streamed reasoning + text.
  // A block of at least N tokens repeating REPEAT_THRESHOLD times consecutively
  // within the last WINDOW_TOKENS tokens triggers recovery (remind → replan → terminate).
  ZETHCODE_TEXT_NGRAM_N: number("ZETHCODE_TEXT_NGRAM_N") ?? 4,
  ZETHCODE_TEXT_REPEAT_THRESHOLD: number("ZETHCODE_TEXT_REPEAT_THRESHOLD") ?? 20,
  ZETHCODE_TEXT_WINDOW_TOKENS: number("ZETHCODE_TEXT_WINDOW_TOKENS") ?? 500,

  // Caps applied to image attachments before a prompt is sent. Both default to
  // undefined (no limit). ZETHCODE_MAX_PROMPT_IMAGES bounds how many images may
  // be sent per request (oldest excess images are dropped); ZETHCODE_MAX_PROMPT_IMAGE_SIZE
  // bounds the decoded byte size of a single image. Values must be positive integers.
  ZETHCODE_MAX_PROMPT_IMAGES: number("ZETHCODE_MAX_PROMPT_IMAGES"),
  ZETHCODE_MAX_PROMPT_IMAGE_SIZE: number("ZETHCODE_MAX_PROMPT_IMAGE_SIZE"),
  ZETHCODE_MIMO_ONLY,
  ZETHCODE_DISABLE_PROVIDER_ENV: ZETHCODE_MIMO_ONLY || truthy("ZETHCODE_DISABLE_PROVIDER_ENV"),
  ZETHCODE_DISABLE_CLAUDE_CODE,
  get ZETHCODE_DISABLE_CLAUDE_CODE_MCP() {
    // MCP compatibility stays on in mimo-only mode so users can reuse Claude Code
    // MCP servers without inheriting prompts, skills, or provider env keys.
    return ZETHCODE_DISABLE_CLAUDE_CODE_ENV || truthy("ZETHCODE_DISABLE_CLAUDE_CODE_MCP")
  },
  ZETHCODE_DISABLE_CLAUDE_CODE_PROMPT: ZETHCODE_DISABLE_CLAUDE_CODE || truthy("ZETHCODE_DISABLE_CLAUDE_CODE_PROMPT"),
  // Defaults to false (enabled): markdown commands under ~/.claude/commands and
  // {project}/.claude/commands load as slash commands. Independent of the
  // mimo-only master switch. Set ZETHCODE_DISABLE_CLAUDE_CODE_COMMANDS=true to disable.
  ZETHCODE_DISABLE_CLAUDE_CODE_COMMANDS: truthy("ZETHCODE_DISABLE_CLAUDE_CODE_COMMANDS"),
  ZETHCODE_DISABLE_CLAUDE_CODE_SKILLS,
  ZETHCODE_DISABLE_EXTERNAL_SKILLS,
  ZETHCODE_DISABLE_CODEX_SKILLS: ZETHCODE_DISABLE_EXTERNAL_SKILLS || truthy("ZETHCODE_DISABLE_CODEX_SKILLS"),
  ZETHCODE_DISABLE_OPENCODE_SKILLS: ZETHCODE_DISABLE_EXTERNAL_SKILLS || truthy("ZETHCODE_DISABLE_OPENCODE_SKILLS"),

  // Defaults to false. When enabled, skill-source commands appear in the `/`
  // autocomplete dropdown alongside user commands and MCP prompts (Claude
  // Code-style). By default skills are only surfaced via the `/skills` picker
  // and model-driven invocation, keeping the `/` list focused on user-authored
  // commands.
  ZETHCODE_ENABLE_SLASH_SKILLS: truthy("ZETHCODE_ENABLE_SLASH_SKILLS"),
  ZETHCODE_FAKE_VCS: process.env["ZETHCODE_FAKE_VCS"],

  // When enabled, skips all git subprocess calls during project discovery
  // (which git, rev-parse --git-common-dir, rev-parse --show-toplevel) and
  // branch detection. The project is treated as a non-git directory rooted at
  // the working directory. Use to avoid touching git in restricted/sandboxed
  // environments or where git startup probing is undesirable.
  ZETHCODE_DISABLE_GIT: truthy("ZETHCODE_DISABLE_GIT"),
  ZETHCODE_SERVER_PASSWORD: process.env["ZETHCODE_SERVER_PASSWORD"],
  ZETHCODE_SERVER_USERNAME: process.env["ZETHCODE_SERVER_USERNAME"],
  ZETHCODE_ENABLE_QUESTION_TOOL: truthy("ZETHCODE_ENABLE_QUESTION_TOOL"),

  // Defaults to false. The edit tool does pure exact-string matching with
  // explicit error signals. Set ZETHCODE_ENABLE_FUZZY_EDIT=true to opt into the
  // legacy multi-stage fuzzy fallback chain (line-trimmed / block-anchor /
  // whitespace-normalized / indentation-flexible / etc.) when old_string fails
  // to match exactly.
  ZETHCODE_ENABLE_FUZZY_EDIT: truthy("ZETHCODE_ENABLE_FUZZY_EDIT"),

  // Experimental
  ZETHCODE_EXPERIMENTAL,
  ZETHCODE_EXPERIMENTAL_FILEWATCHER: Config.boolean("ZETHCODE_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  ZETHCODE_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("ZETHCODE_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  ZETHCODE_EXPERIMENTAL_ICON_DISCOVERY: ZETHCODE_EXPERIMENTAL || truthy("ZETHCODE_EXPERIMENTAL_ICON_DISCOVERY"),
  ZETHCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("ZETHCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  ZETHCODE_ENABLE_EXA: truthy("ZETHCODE_ENABLE_EXA") || ZETHCODE_EXPERIMENTAL || truthy("ZETHCODE_EXPERIMENTAL_EXA"),
  ZETHCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS: number("ZETHCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"),
  // Token-efficient post-cleanse: strip ANSI / fold \r progress bars / redact
  // secrets / elide super-long lines from bash tool output before it is
  // returned to the model. Only applies when the output fits inline — if the
  // output spills to a truncation file, cleaning is skipped so the on-disk
  // archive stays raw. Off by default. Set to 1/true to opt in.
  ZETHCODE_EXPERIMENTAL_TOKEN_EFFICIENCY: truthy("ZETHCODE_EXPERIMENTAL_TOKEN_EFFICIENCY"),
  // Tunables for the token-efficient post-cleanse pipeline (see
  // src/tool/bash_token_efficient_pipeline.ts). Positive integers only;
  // unset / non-positive values fall back to the documented defaults.
  //   MAX_LINE_CHARS   threshold above which a single line is elided  (default 500)
  //   LINE_HEAD_KEEP   chars kept from the head of an elided line     (default 160)
  //   NEVER_WORSE_MARGIN  bytes the cleaned output must beat the raw  (default 0)
  ZETHCODE_EXPERIMENTAL_TOKEN_EFFICIENCY_MAX_LINE_CHARS: number("ZETHCODE_EXPERIMENTAL_TOKEN_EFFICIENCY_MAX_LINE_CHARS") ?? 500,
  ZETHCODE_EXPERIMENTAL_TOKEN_EFFICIENCY_LINE_HEAD_KEEP: number("ZETHCODE_EXPERIMENTAL_TOKEN_EFFICIENCY_LINE_HEAD_KEEP") ?? 160,
  ZETHCODE_EXPERIMENTAL_TOKEN_EFFICIENCY_NEVER_WORSE_MARGIN: number("ZETHCODE_EXPERIMENTAL_TOKEN_EFFICIENCY_NEVER_WORSE_MARGIN") ?? 0,
  // Heuristic (shape-based) filter pipeline for bash output. Runs AFTER the
  // common pipeline, only when the common pipeline is enabled AND this flag is
  // explicitly opted in. Each shape (gitdiff / pytest / npm / make /
  // stacktrace / tsc / kubectl / json / md / gostest) recognises a command
  // pattern or body fingerprint and rewrites the body to strip predictable
  // noise. Off by default. Set to 1/true to opt in.
  ZETHCODE_EXPERIMENTAL_TOKEN_EFFICIENCY_HEURISTIC: truthy("ZETHCODE_EXPERIMENTAL_TOKEN_EFFICIENCY_HEURISTIC"),
  ZETHCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX: number("ZETHCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX"),
  ZETHCODE_EXPERIMENTAL_OXFMT: ZETHCODE_EXPERIMENTAL || truthy("ZETHCODE_EXPERIMENTAL_OXFMT"),
  ZETHCODE_EXPERIMENTAL_LSP_TY: truthy("ZETHCODE_EXPERIMENTAL_LSP_TY"),
  ZETHCODE_EXPERIMENTAL_LSP_TOOL: ZETHCODE_EXPERIMENTAL || truthy("ZETHCODE_EXPERIMENTAL_LSP_TOOL"),
  // Defaults to OFF (opt-in): the Orchestrator primary mode — a general
  // coordinator that delegates to child sessions via the `session` tool, with a
  // global singleton workspace and child permission-approval routing. Enable with
  // ZETHCODE_EXPERIMENTAL_ORCHESTRATOR=true (or the umbrella ZETHCODE_EXPERIMENTAL).
  ZETHCODE_EXPERIMENTAL_ORCHESTRATOR: ZETHCODE_EXPERIMENTAL || truthy("ZETHCODE_EXPERIMENTAL_ORCHESTRATOR"),
  // Defaults to true: dynamic workflow + built-in deep-research are on by default.
  // Set ZETHCODE_EXPERIMENTAL_WORKFLOW_TOOL=false to opt out. The env-var name is
  // kept for backwards compat (long-running experiments still pass it as `1`).
  ZETHCODE_EXPERIMENTAL_WORKFLOW_TOOL: !falsy("ZETHCODE_EXPERIMENTAL_WORKFLOW_TOOL"),
  // Defaults to true: cron + self-paced loop scheduling are on by default.
  // Set ZETHCODE_EXPERIMENTAL_CRON=false to opt out. Runtime kill switch is
  // ZETHCODE_DISABLE_CRON (checked live every tick).
  ZETHCODE_EXPERIMENTAL_CRON: !falsy("ZETHCODE_EXPERIMENTAL_CRON"),
  // Keepalive contract for self-paced loops (spec [S8]). Budget = how many
  // "forget" turns the model gets before the loop is declared model_stopped;
  // delay seconds = the auto-arm horizon used for the keepalive fire. Budget
  // accepts 0 (end immediately on the first turn without a re-arm) for tests
  // and aggressive policies. Both are getters so tests can flip the env var
  // between cases without restarting the process.
  get ZETHCODE_LOOP_KEEPALIVE_BUDGET() {
    return nonNegativeNumber("ZETHCODE_LOOP_KEEPALIVE_BUDGET") ?? 1
  },
  get ZETHCODE_LOOP_KEEPALIVE_DELAY_S() {
    return number("ZETHCODE_LOOP_KEEPALIVE_DELAY_S") ?? 1200
  },
  ZETHCODE_EXPERIMENTAL_MARKDOWN: !falsy("ZETHCODE_EXPERIMENTAL_MARKDOWN"),
  ZETHCODE_MODELS_URL: process.env["ZETHCODE_MODELS_URL"],
  ZETHCODE_MODELS_PATH: process.env["ZETHCODE_MODELS_PATH"],
  ZETHCODE_DISABLE_EMBEDDED_WEB_UI: truthy("ZETHCODE_DISABLE_EMBEDDED_WEB_UI"),
  ZETHCODE_DB: process.env["ZETHCODE_DB"],

  // Defaults to true — all channels share a single zethcode.db. The per-channel
  // DB isolation (zethcode-{channel}.db) is unnecessary for zethcode since we
  // don't ship multiple release channels yet. Use ZETHCODE_HOME to isolate dev
  // environments instead. Set ZETHCODE_DISABLE_CHANNEL_DB=false to restore
  // per-channel isolation.
  ZETHCODE_DISABLE_CHANNEL_DB: !falsy("ZETHCODE_DISABLE_CHANNEL_DB"),
  ZETHCODE_SKIP_MIGRATIONS: truthy("ZETHCODE_SKIP_MIGRATIONS"),
  ZETHCODE_STRICT_CONFIG_DEPS: truthy("ZETHCODE_STRICT_CONFIG_DEPS"),

  ZETHCODE_WORKSPACE_ID: process.env["ZETHCODE_WORKSPACE_ID"],
  ZETHCODE_EXPERIMENTAL_HTTPAPI: truthy("ZETHCODE_EXPERIMENTAL_HTTPAPI"),
  ZETHCODE_EXPERIMENTAL_WORKSPACES: ZETHCODE_EXPERIMENTAL || truthy("ZETHCODE_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.

  // Disables compose-agent-internal skills (e.g. compose:plan, compose:review,
  // compose:tdd). These are hidden workflow-orchestration skills only visible
  // to the compose agent and are NOT part of builtin skills.
  get ZETHCODE_DISABLE_COMPOSE_SKILLS() {
    return truthy("ZETHCODE_DISABLE_COMPOSE_SKILLS")
  },
  // Disables user-facing builtin skills shipped with the binary (e.g.
  // evolve). Does not affect compose skills — the two sets are
  // independent and non-overlapping.
  get ZETHCODE_DISABLE_BUILTIN_SKILLS() {
    return truthy("ZETHCODE_DISABLE_BUILTIN_SKILLS")
  },
  // Disables the built-in official skills (docx, pdf, pptx, xlsx,
  // html-to-video-pipeline) while keeping the rest of the builtin bundle
  // available. Defaults to false (all skills are extracted and loaded). Set
  // ZETHCODE_DISABLE_OFFICIAL_SKILLS=true to skip them.
  get ZETHCODE_DISABLE_OFFICIAL_SKILLS() {
    return truthy("ZETHCODE_DISABLE_OFFICIAL_SKILLS")
  },
  get ZETHCODE_DISABLE_PROJECT_CONFIG() {
    return truthy("ZETHCODE_DISABLE_PROJECT_CONFIG")
  },
  get ZETHCODE_TUI_CONFIG() {
    return process.env["ZETHCODE_TUI_CONFIG"]
  },
  get ZETHCODE_CONFIG_DIR() {
    return process.env["ZETHCODE_CONFIG_DIR"]
  },
  get ZETHCODE_HOME() {
    return process.env["ZETHCODE_HOME"]
  },
  get ZETHCODE_PURE() {
    return truthy("ZETHCODE_PURE")
  },
  get ZETHCODE_PLUGIN_META_FILE() {
    return process.env["ZETHCODE_PLUGIN_META_FILE"]
  },
  get ZETHCODE_CLIENT() {
    return process.env["ZETHCODE_CLIENT"] ?? "cli"
  },
}
