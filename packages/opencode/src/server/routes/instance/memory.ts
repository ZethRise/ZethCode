import { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import z from "zod"
import { Memory } from "@/memory"
import { lazy } from "@/util/lazy"
import { jsonRequest } from "./trace"

export const MemoryRoutes = lazy(() =>
  new Hono()
    .get(
      "/health",
      describeRoute({
        summary: "Get memory index health",
        operationId: "memory.health",
        responses: {
          200: {
            description: "Memory health",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    files: z.number(),
                    indexed: z.number(),
                    stale: z.number(),
                    missing: z.number(),
                    ok: z.boolean(),
                  }),
                ),
              },
            },
          },
        },
      }),
      async (c) =>
        jsonRequest("MemoryRoutes.health", c, function* () {
          const memory = yield* Memory.Service
          return yield* memory.health()
        }),
    )
    .post(
      "/reindex",
      describeRoute({
        summary: "Reindex memory",
        operationId: "memory.reindex",
        responses: {
          200: {
            description: "Reindex result",
            content: {
              "application/json": {
                schema: resolver(z.object({ indexed: z.number(), pruned: z.number() })),
              },
            },
          },
        },
      }),
      async (c) =>
        jsonRequest("MemoryRoutes.reindex", c, function* () {
          const memory = yield* Memory.Service
          return yield* memory.reconcile()
        }),
    ),
)
