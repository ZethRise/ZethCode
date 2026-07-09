import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@zethrise/plugin/tui"
import { createMemo, createSignal, For, Show, onCleanup, onMount } from "solid-js"

const id = "internal:sidebar-git"
const POLL_MS = 3000

type GitFile = {
  code: string
  file: string
}

async function git(args: string[], cwd: string): Promise<string> {
  const proc = Bun.spawn(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" })
  const text = await new Response(proc.stdout).text()
  await proc.exited
  return text.trim()
}

async function getStatus(cwd: string): Promise<GitFile[]> {
  const raw = await git(["status", "--porcelain", "-uall"], cwd)
  if (!raw) return []
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => ({
      code: line.slice(0, 2),
      file: line.slice(3),
    }))
}

async function stageAll(cwd: string) {
  await git(["add", "-A"], cwd)
}

async function commit(cwd: string, message: string) {
  await git(["commit", "-m", message], cwd)
}

async function push(cwd: string) {
  await git(["push"], cwd)
}

async function pull(cwd: string) {
  await git(["pull", "--rebase"], cwd)
}

function statusIcon(code: string) {
  if (code === "??") return "?"
  if (code.includes("A")) return "+"
  if (code.includes("D")) return "-"
  if (code.includes("R")) return "R"
  return "~"
}

function statusColor(code: string, theme: TuiPluginApi["theme"]["current"]) {
  if (code === "??" || code.includes("A")) return { fg: theme.success }
  if (code.includes("D")) return { fg: theme.error }
  return { fg: theme.warning }
}

function splitFile(input: string) {
  const normalized = input.replace(/\\/g, "/")
  const parts = normalized.split("/")
  return { dir: parts.slice(0, -1).join("/"), name: parts.at(-1) ?? input }
}

function compactDir(input: string) {
  if (!input) return ""
  const parts = input.split("/")
  if (parts.length <= 2) return input
  return `${parts[0]}/.../${parts.at(-1)}`
}

function Section(props: {
  title: string
  count: number
  files: GitFile[]
  open: boolean
  setOpen: (value: boolean) => void
  theme: TuiPluginApi["theme"]["current"]
}) {
  return (
    <Show when={props.count > 0}>
      <box>
        <box flexDirection="row" gap={1} onMouseDown={() => props.setOpen(!props.open)}>
          <text fg={props.theme.textMuted}>{props.open ? "v" : ">"}</text>
          <text fg={props.theme.text}>
            <b>{props.title}</b>
          </text>
          <text fg={props.theme.textMuted}>{props.count}</text>
        </box>
        <Show when={props.open}>
          <box paddingLeft={1}>
            <For each={props.files.slice(0, 8)}>
              {(item) => {
                const file = splitFile(item.file)
                return (
                  <box flexDirection="row" gap={1}>
                    <text flexShrink={0} style={statusColor(item.code, props.theme)}>
                      {statusIcon(item.code)}
                    </text>
                    <box>
                      <text fg={props.theme.text} wrapMode="none">
                        {file.name}
                      </text>
                      <Show when={file.dir}>
                        <text fg={props.theme.textMuted} wrapMode="none">
                          {compactDir(file.dir)}
                        </text>
                      </Show>
                    </box>
                  </box>
                )
              }}
            </For>
            <Show when={props.files.length > 8}>
              <text fg={props.theme.textMuted}>  +{props.files.length - 8} more</text>
            </Show>
          </box>
        </Show>
      </box>
    </Show>
  )
}

function View(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current
  const [files, setFiles] = createSignal<GitFile[]>([])
  const [message, setMessage] = createSignal("")
  const [busy, setBusy] = createSignal(false)
  const [open, setOpen] = createSignal(true)
  const [stagedOpen, setStagedOpen] = createSignal(true)
  const [unstagedOpen, setUnstagedOpen] = createSignal(true)
  const [error, setError] = createSignal("")
  let mounted = true

  const cwd = createMemo(() => props.api.state.path.directory || process.cwd())

  const refresh = async () => {
    if (!mounted) return
    try {
      const result = await getStatus(cwd())
      if (mounted) setFiles(result)
    } catch {
      // not a git repo or git not available
    }
  }

  onMount(() => {
    void refresh()
    const handle = setInterval(() => void refresh(), POLL_MS)
    onCleanup(() => {
      mounted = false
      clearInterval(handle)
    })
  })

  const branch = createMemo(() => props.api.state.vcs?.branch ?? "detached")
  const staged = createMemo(() => files().filter((f) => f.code.charAt(0) !== " " && f.code.charAt(0) !== "?"))
  const unstaged = createMemo(() => files().filter((f) => f.code === "??" || f.code.charAt(1) !== " "))
  const total = createMemo(() => files().length)

  const doCommit = async () => {
    if (busy() || !message().trim()) return
    setBusy(true)
    setError("")
    try {
      await stageAll(cwd())
      await commit(cwd(), message().trim())
      setMessage("")
      await refresh()
      props.api.ui.toast({ message: "Committed", variant: "success" })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      props.api.ui.toast({ message: `Commit failed: ${msg}`, variant: "error" })
    } finally {
      setBusy(false)
    }
  }

  const doSync = async () => {
    if (busy()) return
    setBusy(true)
    setError("")
    try {
      if (files().length > 0 && message().trim()) {
        await stageAll(cwd())
        await commit(cwd(), message().trim())
        setMessage("")
      }
      await pull(cwd())
      await push(cwd())
      await refresh()
      props.api.ui.toast({ message: "Synced", variant: "success" })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      props.api.ui.toast({ message: `Sync failed: ${msg}`, variant: "error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Show when={total() > 0 || props.api.state.vcs?.branch}>
      <box>
        <box flexDirection="row" gap={1} onMouseDown={() => setOpen((x) => !x)}>
          <text fg={theme().textMuted}>{open() ? "v" : ">"}</text>
          <text fg={theme().text}>
            <b>Source Control</b>
          </text>
          <Show when={total() > 0}>
            <text fg={theme().textMuted}>{total()}</text>
          </Show>
        </box>

        <Show when={open()}>
          <box paddingLeft={1}>
            <box flexDirection="row" gap={1}>
              <text fg={theme().textMuted}>branch</text>
              <text fg={theme().text} wrapMode="none">
                {branch()}
              </text>
            </box>
          </box>

          <Section
            title="Staged"
            count={staged().length}
            files={staged()}
            open={stagedOpen()}
            setOpen={setStagedOpen}
            theme={theme()}
          />
          <Section
            title="Changes"
            count={unstaged().length}
            files={unstaged()}
            open={unstagedOpen()}
            setOpen={setUnstagedOpen}
            theme={theme()}
          />

          <Show when={files().length === 0}>
            <box paddingLeft={1}>
              <text fg={theme().success}>Clean tree</text>
            </box>
          </Show>

          <box paddingTop={1} gap={1}>
            <box
              width="100%"
              backgroundColor={theme().backgroundElement}
              paddingLeft={1}
              paddingRight={1}
              onMouseUp={(evt) => {
                evt.stopPropagation()
                props.api.ui.dialog.replace(() => (
                  <props.api.ui.DialogPrompt
                    title="Commit Message"
                    placeholder="Enter commit message..."
                    onConfirm={(text) => {
                      setMessage(text)
                      props.api.ui.dialog.clear()
                      void doCommit()
                    }}
                    onCancel={() => props.api.ui.dialog.clear()}
                  />
                ))
              }}
            >
              <text fg={message() ? theme().text : theme().textMuted}>{message() || "Commit message"}</text>
            </box>

            <box flexDirection="row" gap={1}>
              <box
                width={17}
                backgroundColor={message().trim() && !busy() ? theme().primary : theme().backgroundElement}
                justifyContent="center"
                paddingLeft={1}
                paddingRight={1}
                onMouseDown={() => void doCommit()}
              >
                <text fg={message().trim() && !busy() ? theme().selectedListItemText : theme().textMuted}>
                  {busy() ? "..." : "Commit"}
                </text>
              </box>
              <box
                width={17}
                backgroundColor={busy() ? theme().backgroundElement : theme().backgroundPanel}
                justifyContent="center"
                paddingLeft={1}
                paddingRight={1}
                onMouseDown={() => void doSync()}
              >
                <text fg={busy() ? theme().textMuted : theme().text}>{busy() ? "..." : "Sync"}</text>
              </box>
            </box>
          </box>

          <Show when={error()}>
            <text fg={theme().error}>{error()}</text>
          </Show>
        </Show>
      </box>
    </Show>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 325,
    slots: {
      sidebar_content() {
        return <View api={api} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
}

export default plugin
