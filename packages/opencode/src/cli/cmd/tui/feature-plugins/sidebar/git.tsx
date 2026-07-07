import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@zethrise/plugin/tui"
import { createMemo, createSignal, For, Show, onCleanup, onMount } from "solid-js"
import { Process } from "@/util"

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
  return raw.split("\n").filter(Boolean).map((line) => ({
    code: line.slice(0, 2).trim(),
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

function statusIcon(code: string): string {
  if (code === "??" || code.includes("A")) return "+"
  if (code.includes("D")) return "−"
  return "~"
}

function statusColor(code: string, theme: TuiPluginApi["theme"]["current"]): object {
  if (code === "??" || code.includes("A")) return { fg: theme.success }
  if (code.includes("D")) return { fg: theme.error }
  return { fg: theme.warning }
}

function View(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current
  const [files, setFiles] = createSignal<GitFile[]>([])
  const [message, setMessage] = createSignal("")
  const [busy, setBusy] = createSignal(false)
  const [open, setOpen] = createSignal(true)
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

  const staged = createMemo(() => files().filter((f) => !"??".includes(f.code.charAt(0)) && f.code.charAt(0) !== " "))
  const unstaged = createMemo(() => files().filter((f) => f.code === "??" || f.code.charAt(0) === " " || f.code.charAt(1) !== " "))
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
      // commit first if there are changes and a message
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
          <text fg={theme().text}>{open() ? "▼" : "▶"}</text>
          <text fg={theme().text}>
            <b>Source Control</b>
          </text>
          <Show when={total() > 0}>
            <text fg={theme().textMuted}>{total()}</text>
          </Show>
        </box>

        <Show when={open()}>
          {/* Changed files list */}
          <Show when={files().length > 0}>
            <box paddingLeft={1}>
              <For each={files().slice(0, 8)}>
                {(item) => (
                  <box flexDirection="row" gap={1}>
                    <text flexShrink={0} style={statusColor(item.code, theme())}>
                      {statusIcon(item.code)}
                    </text>
                    <text fg={theme().textMuted}>{item.file.split("/").pop()}</text>
                  </box>
                )}
              </For>
              <Show when={files().length > 8}>
                <text fg={theme().textMuted}>  +{files().length - 8} more</text>
              </Show>
            </box>
          </Show>
          <Show when={files().length === 0}>
            <text fg={theme().textMuted}>No changes</text>
          </Show>

          {/* Commit message input */}
          <box paddingTop={1} gap={0}>
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
              <text fg={message() ? theme().text : theme().textMuted}>
                {message() || "Message (click to type)"}
              </text>
            </box>

            {/* Action buttons */}
            <box flexDirection="row" gap={1} paddingTop={0} width="100%">
              <box
                flexGrow={1}
                backgroundColor="#60a5fa"
                justifyContent="center"
                paddingLeft={1}
                paddingRight={1}
                onMouseDown={() => void doCommit()}
              >
                <text fg={busy() ? theme().textMuted : "#ffffff"}>
                  {busy() ? "..." : "✓ Commit"}
                </text>
              </box>
              <box
                flexGrow={1}
                backgroundColor="#1d4ed8"
                justifyContent="center"
                paddingLeft={1}
                paddingRight={1}
                onMouseDown={() => void doSync()}
              >
                <text fg={busy() ? theme().textMuted : "#ffffff"}>
                  {busy() ? "..." : "↻ Sync"}
                </text>
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
