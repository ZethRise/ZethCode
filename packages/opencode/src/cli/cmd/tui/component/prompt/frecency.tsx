import path from "path"
import { Global } from "@/global"
import { Filesystem } from "@/util"
import { onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { createSimpleContext } from "../../context/helper"
import { writeFile } from "fs/promises"

function calculateFrecency(entry?: { frequency: number; lastOpen: number }): number {
  if (!entry) return 0
  const daysSince = (Date.now() - entry.lastOpen) / 86400000 // ms per day
  const weight = 1 / (1 + daysSince)
  return entry.frequency * weight
}

const MAX_FRECENCY_ENTRIES = 1000

function isFrecencyEntry(value: unknown): value is { path: string; frequency: number; lastOpen: number } {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return typeof item.path === "string" && typeof item.frequency === "number" && typeof item.lastOpen === "number"
}

export const { use: useFrecency, provider: FrecencyProvider } = createSimpleContext({
  name: "Frecency",
  init: () => {
    const frecencyPath = path.join(Global.Path.state, "frecency.jsonl")
    let write = Promise.resolve()
    const persist = (data: Record<string, { frequency: number; lastOpen: number }>) => {
      const content = Object.entries(data).map(([path, entry]) => JSON.stringify({ path, ...entry })).join("\n")
      write = write.then(() => writeFile(frecencyPath, content ? content + "\n" : "")).catch((error) => console.error("Failed to write frecency", error))
    }
    onMount(async () => {
      const text = await Filesystem.readText(frecencyPath).catch(() => "")
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
        .filter(isFrecencyEntry)

      const latest = lines.reduce(
        (acc, entry) => {
          acc[entry.path] = entry
          return acc
        },
        {} as Record<string, { path: string; frequency: number; lastOpen: number }>,
      )

      const sorted = Object.values(latest)
        .sort((a, b) => b.lastOpen - a.lastOpen)
        .slice(0, MAX_FRECENCY_ENTRIES)

      setStore("data", (data) => ({ ...Object.fromEntries(sorted.map((entry) => [entry.path, { frequency: entry.frequency, lastOpen: entry.lastOpen }])), ...data }))

      if (sorted.length > 0) {
        persist(store.data)
      }
    })

    const [store, setStore] = createStore({
      data: {} as Record<string, { frequency: number; lastOpen: number }>,
    })

    function updateFrecency(filePath: string) {
      const absolutePath = path.resolve(process.cwd(), filePath)
      const newEntry = {
        frequency: (store.data[absolutePath]?.frequency || 0) + 1,
        lastOpen: Date.now(),
      }
      setStore("data", absolutePath, newEntry)
      if (Object.keys(store.data).length > MAX_FRECENCY_ENTRIES) {
        const sorted = Object.entries(store.data)
          .sort(([, a], [, b]) => b.lastOpen - a.lastOpen)
          .slice(0, MAX_FRECENCY_ENTRIES)
        setStore("data", Object.fromEntries(sorted))
        persist(store.data)
        return
      }
      persist(store.data)
    }

    return {
      getFrecency: (filePath: string) => calculateFrecency(store.data[path.resolve(process.cwd(), filePath)]),
      updateFrecency,
      data: () => store.data,
    }
  },
})
