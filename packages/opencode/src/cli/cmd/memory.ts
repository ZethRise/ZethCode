import type { Argv } from "yargs"
import { Instance } from "../../project/instance"
import { cmd } from "./cmd"
import { UI } from "../ui"
import { EOL } from "os"
import { AppRuntime } from "@/effect/app-runtime"
import { Effect } from "effect"
import { Memory } from "@/memory"
import { resolveProjectId } from "@/memory/paths"
import { Global } from "@/global"
import path from "path"
import fs from "fs"

export const MemoryCommand = cmd({
  command: "memory <action> [text..]",
  describe: "manage project or global memory",
  builder: (yargs: Argv) => {
    return yargs
      .positional("action", {
        describe: "action to perform (list, add, search, health, reindex)",
        type: "string",
        choices: ["list", "add", "search", "health", "reindex"],
        demandOption: true,
      })
      .positional("text", {
        describe: "text to add or query to search",
        type: "string",
        array: true,
      })
      .option("project", {
        describe: "target project memory instead of global memory for 'add'",
        type: "boolean",
        default: false,
      })
  },
  handler: async (args) => {
    const action = args.action
    const textParts = args.text || []
    const textContent = textParts.join(" ")

    await Instance.provide({
      directory: process.cwd(),
      async fn() {
        const projectHash = resolveProjectId(Instance.worktree)
        const globalFile = path.join(Global.Path.data, "memory", "global", "MEMORY.md")
        const projectFile = path.join(Global.Path.data, "memory", "projects", projectHash, "MEMORY.md")

        if (action === "list") {
          UI.println(UI.Style.TEXT_INFO_BOLD + "=== Global Memory ===" + UI.Style.TEXT_NORMAL)
          if (fs.existsSync(globalFile)) {
            UI.println(fs.readFileSync(globalFile, "utf-8"))
          } else {
            UI.println("No global memory recorded.")
          }
          UI.println()
          UI.println(UI.Style.TEXT_INFO_BOLD + `=== Project Memory (${projectHash}) ===` + UI.Style.TEXT_NORMAL)
          if (fs.existsSync(projectFile)) {
            UI.println(fs.readFileSync(projectFile, "utf-8"))
          } else {
            UI.println("No project memory recorded.")
          }
          return
        }

        if (action === "add") {
          if (!textContent.trim()) {
            UI.error("Please provide text to add to memory")
            process.exit(1)
          }

          const targetFile = args.project ? projectFile : globalFile
          const targetDir = path.dirname(targetFile)
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
          }

          let existing = ""
          if (fs.existsSync(targetFile)) {
            existing = fs.readFileSync(targetFile, "utf-8").trim()
          }

          const header = args.project ? "## Rules" : "# Global memory"
          if (!existing.includes(header)) {
            existing = existing ? `${existing}\n\n${header}` : header
          }

          const updated = `${existing}\n- ${textContent}`
          fs.writeFileSync(targetFile, updated, "utf-8")
          UI.println(UI.Style.TEXT_SUCCESS_BOLD + "Memory updated: " + UI.Style.TEXT_NORMAL + targetFile)

          // Reconcile index
          await AppRuntime.runPromise(
            Effect.gen(function* () {
              const memory = yield* Memory.Service
              yield* memory.reconcile()
            })
          )
          return
        }

        if (action === "health") {
          await AppRuntime.runPromise(
            Effect.gen(function* () {
              const memory = yield* Memory.Service
              const health = yield* memory.health()
              UI.println(
                `${health.ok ? "OK" : "STALE"}: ${health.files} files, ${health.indexed} indexed, ${health.missing} missing, ${health.stale} stale`,
              )
            })
          )
          return
        }

        if (action === "reindex") {
          await AppRuntime.runPromise(
            Effect.gen(function* () {
              const memory = yield* Memory.Service
              const result = yield* memory.reconcile()
              UI.println(`Reindexed memory: ${result.indexed} updated, ${result.pruned} pruned.`)
            })
          )
          return
        }

        if (action === "search") {
          if (!textContent.trim()) {
            UI.error("Please provide a search query")
            process.exit(1)
          }

          await AppRuntime.runPromise(
            Effect.gen(function* () {
              const memory = yield* Memory.Service
              const results = yield* memory.search({ query: textContent, limit: 5 })
              if (results.length === 0) {
                UI.println("No matches found.")
                return
              }
              UI.println(`Found ${results.length} matches:`)
              for (const r of results) {
                UI.println(EOL + UI.Style.TEXT_INFO_BOLD + `### ${path.basename(r.path)} (${r.scope})` + UI.Style.TEXT_NORMAL)
                UI.println(r.snippet.replace(/<<([^>]+)>>/g, UI.Style.TEXT_WARNING_BOLD + "$1" + UI.Style.TEXT_NORMAL))
              }
            })
          )
        }
      },
    })
  },
})
