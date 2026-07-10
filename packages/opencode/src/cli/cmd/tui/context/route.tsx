import { createStore, reconcile } from "solid-js/store"
import { createMemo, type Accessor } from "solid-js"
import { createSimpleContext } from "./helper"
import type { PromptInfo } from "../component/prompt/history"
import z from "zod"

export type HomeRoute = {
  type: "home"
  prompt?: PromptInfo
}

export type SessionRoute = {
  type: "session"
  sessionID: string
  agentID?: string
  /** When set, the session view renders the full-screen workflow detail page for
   * this run (replacing the message stream), mirroring how agentID renders a
   * subagent's conversation. Cleared to return to the main conversation. */
  workflowRunID?: string
  /** When an agent (agentID) was opened FROM a workflow page, this records that
   * origin run so "back" returns to the workflow rather than the main conversation. */
  fromWorkflowRunID?: string
  prompt?: PromptInfo
}

export type PluginRoute = {
  type: "plugin"
  id: string
  data?: Record<string, unknown>
}

export type Route = HomeRoute | SessionRoute | PluginRoute

const RouteSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("home") }).passthrough(),
  z.object({ type: z.literal("session"), sessionID: z.string().min(1) }).passthrough(),
  z.object({ type: z.literal("plugin"), id: z.string().min(1) }).passthrough(),
])

function initialRoute(): Route {
  const value = process.env["ZETHCODE_ROUTE"]
  if (!value) return { type: "home" }
  try {
    return RouteSchema.safeParse(JSON.parse(value)).data ?? { type: "home" }
  } catch {
    return { type: "home" }
  }
}

export const { use: useRoute, provider: RouteProvider } = createSimpleContext({
  name: "Route",
  init: (props: { initialRoute?: Route }) => {
    const [store, setStore] = createStore<Route>(
      props.initialRoute ?? initialRoute(),
    )

    return {
      get data() {
        return store
      },
      navigate(route: Route) {
        setStore(reconcile(route))
      },
    }
  },
})

export type RouteContext = ReturnType<typeof useRoute>

export function useRouteData<T extends Route["type"]>(type: T) {
  const route = useRoute()
  return route.data as Extract<Route, { type: typeof type }>
}

export function useCurrentAgentID(): Accessor<string> {
  const route = useRoute()
  return createMemo(() =>
    route.data.type === "session" ? (route.data.agentID ?? "main") : "main",
  )
}
