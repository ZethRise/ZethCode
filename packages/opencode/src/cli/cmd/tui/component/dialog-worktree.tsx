import { createMemo, createSignal, onMount } from "solid-js"
import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import { DialogConfirm } from "@tui/ui/dialog-confirm"
import { useSDK } from "../context/sdk"
import { useSync } from "@tui/context/sync"
import { useRoute } from "@tui/context/route"
import { useToast } from "../ui/toast"
import { errorMessage } from "@/util/error"
import { Keybind } from "@/util"
import path from "path"

const CREATE_SENTINEL = "__create_worktree__"

type Worktree = { directory: string; branch: string; dirty: boolean }

async function inspect(directory: string): Promise<Worktree> {
  const branch = Bun.spawn(["git", "-C", directory, "branch", "--show-current"], { stdout: "pipe" })
  const status = Bun.spawn(["git", "-C", directory, "status", "--porcelain"], { stdout: "pipe" })
  return {
    directory,
    branch: (await new Response(branch.stdout).text()).trim() || "detached",
    dirty: (await new Response(status.stdout).text()).trim().length > 0,
  }
}

async function apply(directory: string, target: string) {
  const diff = Bun.spawn(["git", "-C", directory, "diff", "--binary", "HEAD"], { stdout: "pipe" })
  const patch = await new Response(diff.stdout).text()
  if (!patch) return false
  const proc = Bun.spawn(["git", "-C", target, "apply", "--3way", "--index"], { stdin: "pipe", stderr: "pipe" })
  proc.stdin?.write(patch)
  proc.stdin?.end()
  if ((await proc.exited) === 0) return true
  throw new Error((await new Response(proc.stderr).text()).trim() || "Failed to apply worktree changes")
}

export function DialogWorktree() {
  const dialog = useDialog()
  const sdk = useSDK()
  const sync = useSync()
  const route = useRoute()
  const toast = useToast()
  const [worktrees, setWorktrees] = createSignal<Worktree[]>()
  const [busy, setBusy] = createSignal<string>()

  onMount(async () => {
    dialog.setSize("medium")
    const result = await sdk.client.worktree.list().catch(() => undefined)
    setWorktrees(await Promise.all((result?.data ?? []).map(inspect)))
  })

  const options = createMemo(() => {
    const b = busy()
    if (b) {
      return [{ title: b, value: "__busy__" }]
    }

    const list = worktrees()
    if (!list) {
      return [{ title: "Loading worktrees...", value: "__loading__" }]
    }

    const items = list.map((worktree) => ({
      title: `${path.basename(worktree.directory)} (${worktree.branch})${worktree.dirty ? " *" : ""}`,
      value: worktree.directory,
      description: worktree.directory,
    }))

    return [
      ...items,
      {
        title: "+ Create new worktree",
        value: CREATE_SENTINEL,
        description: undefined as string | undefined,
      },
    ]
  })

  async function switchTo(directory: string) {
    setBusy("Switching to worktree...")
    const previous = sdk.directory
    try {
      await sdk.client.instance.dispose()
      sdk.switchDirectory(directory)
      await sync.bootstrap()
      route.navigate({ type: "home" })
      dialog.clear()
      toast.show({ message: `Switched to ${path.basename(directory)}`, variant: "success" })
    } catch (error) {
      if (previous) {
        sdk.switchDirectory(previous)
        await sync.bootstrap().catch(() => {})
      }
      setBusy(undefined)
      toast.show({ message: error instanceof Error ? error.message : "Failed to switch worktree", variant: "error" })
    }
  }

  async function create() {
    setBusy("Creating worktree...")
    const result = await sdk.client.worktree.create().catch((error) => ({ data: undefined, error }))
    if (!result?.data) {
      toast.show({ message: result.error ? errorMessage(result.error) : "Failed to create worktree", variant: "error" })
      setBusy(undefined)
      return
    }
    await switchTo(result.data.directory)
  }

  async function applyChanges(directory: string) {
    const target = sdk.directory
    if (!target || target === directory) return
    const confirmed = await DialogConfirm.show(
      dialog,
      "Apply worktree changes",
      `Apply tracked changes from ${path.basename(directory)} to ${path.basename(target)}? Git will stop on conflicts.`,
    )
    if (!confirmed) return
    setBusy("Applying worktree changes...")
    try {
      if (!await apply(directory, target)) {
        toast.show({ message: "Worktree has no tracked changes", variant: "info" })
        return
      }
      toast.show({ message: `Applied changes from ${path.basename(directory)}`, variant: "success" })
      setWorktrees(await Promise.all((worktrees() ?? []).map((item) => inspect(item.directory))))
    } catch (error) {
      toast.show({ message: errorMessage(error), variant: "error" })
    } finally {
      setBusy(undefined)
    }
  }

  return (
    <DialogSelect
      title="Worktrees"
      options={options()}
      skipFilter={true}
      onSelect={(option) => {
        if (option.value === "__busy__" || option.value === "__loading__") return
        if (option.value === CREATE_SENTINEL) {
          void create()
          return
        }
        void switchTo(option.value)
      }}
      keybind={[
        {
          keybind: Keybind.parse("ctrl+m")[0],
          title: "apply changes",
          onTrigger: (option) => {
            if (option.value !== CREATE_SENTINEL) void applyChanges(option.value)
          },
        },
      ]}
    />
  )
}
