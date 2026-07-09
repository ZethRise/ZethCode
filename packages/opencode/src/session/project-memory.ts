import fs from "fs/promises"
import path from "path"
import { Effect } from "effect"
import type { ProjectID } from "@/project/schema"
import { indexFromDisk } from "@/memory/reconcile"
import { MemoryFtsTable } from "@/memory/fts.sql"
import { Database, and, eq } from "@/storage"
import { MEMORY_TEMPLATE } from "./checkpoint-templates"
import { memoryPath, migrateProjectMemory } from "./checkpoint-paths"

export function localMemoryPath(directory: string) {
  return path.join(directory, ".zethcode", "MEMORY.md")
}

export function hasProjectMemory(input: { projectID: ProjectID; directory: string }) {
  return Effect.gen(function* () {
    yield* Effect.promise(() => migrateProjectMemory(input.projectID))
    yield* indexLocalMemory(input).pipe(Effect.ignore)
    if (yield* hasText(localMemoryPath(input.directory))) return true
    if (yield* hasText(memoryPath(input.projectID))) return true
    const row = yield* Effect.sync(() =>
      Database.use((db) =>
        db
          .select({ path: MemoryFtsTable.path })
          .from(MemoryFtsTable)
          .where(and(eq(MemoryFtsTable.scope, "projects"), eq(MemoryFtsTable.scope_id, input.projectID)))
          .limit(1)
          .get(),
      ),
    )
    return !!row
  })
}

export function ensureLocalMemory(input: { projectID: ProjectID; directory: string }) {
  return Effect.gen(function* () {
    const target = localMemoryPath(input.directory)
    if (yield* hasText(target)) return target
    yield* Effect.promise(() => fs.mkdir(path.dirname(target), { recursive: true }))
    const legacy = memoryPath(input.projectID)
    const text = yield* Effect.promise(() => Bun.file(legacy).text().catch(() => ""))
    yield* Effect.promise(() => Bun.write(target, text.trim() ? text : MEMORY_TEMPLATE))
    yield* indexLocalMemory(input)
    return target
  })
}

export function indexLocalMemory(input: { projectID: ProjectID; directory: string }) {
  return Effect.promise(async () => {
    const target = localMemoryPath(input.directory)
    if (!(await Bun.file(target).exists())) return
    await indexFromDisk(
      target,
      { scope: "projects", scope_id: input.projectID, type: "memory", key: "MEMORY" },
      "mimo",
    )
  })
}

function hasText(file: string) {
  return Effect.promise(() => Bun.file(file).text().then((text) => text.trim().length > 0).catch(() => false))
}

export * as ProjectMemory from "./project-memory"
