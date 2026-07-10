import path from "path"
import { Global } from "@/global"
import { Filesystem } from "@/util"
import { onMount } from "solid-js"
import { createStore, produce, unwrap } from "solid-js/store"
import { createSimpleContext } from "../../context/helper"
import { writeFile } from "fs/promises"
import type { PromptInfo } from "./history"

export type StashEntry = {
  input: string
  parts: PromptInfo["parts"]
  timestamp: number
}

function isStashEntry(value: unknown): value is StashEntry {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return typeof item.input === "string" && Array.isArray(item.parts) && typeof item.timestamp === "number"
}

const MAX_STASH_ENTRIES = 50

export const { use: usePromptStash, provider: PromptStashProvider } = createSimpleContext({
  name: "PromptStash",
  init: () => {
    const stashPath = path.join(Global.Path.state, "prompt-stash.jsonl")
    let write = Promise.resolve()
    const persist = (entries: StashEntry[]) => {
      const content = entries.length ? entries.map((line) => JSON.stringify(line)).join("\n") + "\n" : ""
      write = write.then(() => writeFile(stashPath, content)).catch((error) => console.error("Failed to write prompt stash", error))
    }
    onMount(async () => {
      const text = await Filesystem.readText(stashPath).catch(() => "")
      const lines = text
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line)
          } catch {
            return null
          }
        })
        .filter(isStashEntry)
        .slice(-MAX_STASH_ENTRIES)

      setStore("entries", (entries) => [...lines, ...entries].slice(-MAX_STASH_ENTRIES))

      // Rewrite file with only valid entries to self-heal corruption
      if (lines.length > 0) {
        persist(store.entries)
      }
    })

    const [store, setStore] = createStore({
      entries: [] as StashEntry[],
    })

    return {
      list() {
        return store.entries
      },
      push(entry: Omit<StashEntry, "timestamp">) {
        const stash = structuredClone(unwrap({ ...entry, timestamp: Date.now() }))
        setStore(
          produce((draft) => {
            draft.entries.push(stash)
            if (draft.entries.length > MAX_STASH_ENTRIES) {
              draft.entries = draft.entries.slice(-MAX_STASH_ENTRIES)
            }
          }),
        )

        persist(store.entries)
      },
      pop() {
        if (store.entries.length === 0) return undefined
        const entry = store.entries[store.entries.length - 1]
        setStore(
          produce((draft) => {
            draft.entries.pop()
          }),
        )
        persist(store.entries)
        return entry
      },
      remove(index: number) {
        if (index < 0 || index >= store.entries.length) return
        setStore(
          produce((draft) => {
            draft.entries.splice(index, 1)
          }),
        )
        persist(store.entries)
      },
    }
  },
})
