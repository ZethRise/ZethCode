import type { Argv } from "yargs"
import path from "path"
import fs from "fs/promises"
import { cmd } from "./cmd"
import { UI } from "../ui"
import { Global } from "@/global"

function slug(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "connector"
}

export const ConnectorCommand = cmd({
  command: "connector <action> [name]",
  describe: "create connector plugin scaffolds",
  builder: (yargs: Argv) =>
    yargs
      .positional("action", {
        type: "string",
        choices: ["create"],
        demandOption: true,
      })
      .positional("name", {
        type: "string",
        describe: "connector name",
      })
      .option("global", {
        type: "boolean",
        describe: "create under global config instead of .zethcode",
        default: false,
      }),
  handler: async (args) => {
    if (args.action !== "create") return
    const name = slug(String(args.name ?? "connector"))
    const root = args.global ? Global.Path.config : path.join(process.cwd(), ".zethcode")
    const dir = path.join(root, "connectors", name)
    const plugin = path.join(dir, "plugin.ts")
    await fs.mkdir(dir, { recursive: true })
    await Bun.write(
      plugin,
      [
        'import type { Hooks, PluginInput } from "@zethrise/plugin"',
        "",
        "export async function Connector(_input: PluginInput): Promise<Hooks> {",
        "  return {",
        "    tool: {},",
        "  }",
        "}",
        "",
        "export default Connector",
        "",
      ].join("\n"),
    )
    const registryPath = path.join(root, "connectors", "registry.json")
    const existing = await Bun.file(registryPath).json().catch(() => ({ connectors: [] }))
    const connectors = [
      ...((Array.isArray(existing.connectors) ? existing.connectors : []) as Array<{ name: string; path: string }>).filter(
        (item) => item.name !== name,
      ),
      { name, path: path.relative(path.join(root, "connectors"), plugin) },
    ]
    await Bun.write(registryPath, JSON.stringify({ connectors }, null, 2) + "\n")
    UI.println(`Connector created: ${plugin}`)
  },
})
