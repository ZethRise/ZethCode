import path from "path"
import { Global } from "@/global"
import { Filesystem } from "@/util"
import { onMount } from "solid-js"
import { createStore, produce, unwrap } from "solid-js/store"
import { createSimpleContext } from "../../context/helper"
import { writeFile } from "fs/promises"
import type { AgentPart, FilePart, TextPart } from "@zethrise/sdk/v2"

export type PromptInfo = {
  input: string
  mode?: "normal" | "shell"
  parts: (
    | Omit<FilePart, "id" | "messageID" | "sessionID">
    | Omit<AgentPart, "id" | "messageID" | "sessionID">
    | (Omit<TextPart, "id" | "messageID" | "sessionID"> & {
        source?: {
          text: {
            start: number
            end: number
            value: string
          }
        }
      })
  )[]
}

function isPromptInfo(value: unknown): value is PromptInfo {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return typeof item.input === "string" && Array.isArray(item.parts) && (item.mode === undefined || item.mode === "normal" || item.mode === "shell")
}

const MAX_HISTORY_ENTRIES = 50

export const { use: usePromptHistory, provider: PromptHistoryProvider } = createSimpleContext({
  name: "PromptHistory",
  init: () => {
    const historyPath = path.join(Global.Path.state, "prompt-history.jsonl")
    let write = Promise.resolve()
    const persist = (history: PromptInfo[]) => {
      const content = history.length ? history.map((line) => JSON.stringify(line)).join("\n") + "\n" : ""
      write = write.then(() => writeFile(historyPath, content)).catch((error) => console.error("Failed to write prompt history", error))
    }
    onMount(async () => {
      const text = await Filesystem.readText(historyPath).catch(() => "")
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
        .filter(isPromptInfo)
        .slice(-MAX_HISTORY_ENTRIES)

      setStore("history", (history) => [...lines, ...history].slice(-MAX_HISTORY_ENTRIES))

      // Rewrite file with only valid entries to self-heal corruption
      if (lines.length > 0) {
        persist(store.history)
      }
    })

    const [store, setStore] = createStore({
      index: 0,
      history: [] as PromptInfo[],
    })

    return {
      move(direction: 1 | -1, input: string) {
        if (!store.history.length) return undefined
        const current = store.history.at(store.index)
        if (!current) return undefined
        if (current.input !== input && input.length) return
        setStore(
          produce((draft) => {
            const next = store.index + direction
            if (Math.abs(next) > store.history.length) return
            if (next > 0) return
            draft.index = next
          }),
        )
        if (store.index === 0)
          return {
            input: "",
            parts: [],
          }
        return store.history.at(store.index)
      },
      append(item: PromptInfo) {
        const entry = structuredClone(unwrap(item))
        setStore(
          produce((draft) => {
            draft.history.push(entry)
            if (draft.history.length > MAX_HISTORY_ENTRIES) {
              draft.history = draft.history.slice(-MAX_HISTORY_ENTRIES)
            }
            draft.index = 0
          }),
        )

        persist(store.history)
      },
    }
  },
})

