import { $ } from "bun"
import semver from "semver"
import path from "path"

const rootPkgPath = path.resolve(import.meta.dir, "../../../package.json")
const rootPkg = await Bun.file(rootPkgPath).json()
const expectedBunVersion = rootPkg.packageManager?.split("@")[1]

if (!expectedBunVersion) {
  throw new Error("packageManager field not found in root package.json")
}

// relax version requirement
const expectedBunVersionRange = `^${expectedBunVersion}`

if (!semver.satisfies(process.versions.bun, expectedBunVersionRange)) {
  throw new Error(`This script requires bun@${expectedBunVersionRange}, but you are using bun@${process.versions.bun}`)
}

const env = {
  ZETHCODE_CHANNEL: process.env["ZETHCODE_CHANNEL"],
  ZETHCODE_BUMP: process.env["ZETHCODE_BUMP"],
  ZETHCODE_VERSION: process.env["ZETHCODE_VERSION"],
  ZETHCODE_RELEASE: process.env["ZETHCODE_RELEASE"],
}
const CHANNEL = await (async () => {
  if (env.ZETHCODE_CHANNEL) return env.ZETHCODE_CHANNEL
  if (env.ZETHCODE_BUMP) return "latest"
  if (env.ZETHCODE_VERSION && !env.ZETHCODE_VERSION.startsWith("0.0.0-")) return "latest"
  const branch = await $`git branch --show-current`.text().then((x) => x.trim())
  if (branch === "main" || branch === "master") return "latest"
  return branch || "latest"
})()
const IS_PREVIEW = CHANNEL !== "latest"

const VERSION = await (async () => {
  if (env.ZETHCODE_VERSION) return env.ZETHCODE_VERSION
  if (IS_PREVIEW) return `0.0.0-${CHANNEL}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`
  const version = await Bun.file(path.resolve(import.meta.dir, "../../opencode/package.json"))
    .json()
    .then((data: any) => data.version)
  const t = env.ZETHCODE_BUMP?.toLowerCase()
  if (!t) return version
  const [major, minor, patch] = version.split(".").map((x: string) => Number(x) || 0)
  if (t === "major") return `${major + 1}.0.0`
  if (t === "minor") return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
})()

export const Script = {
  get channel() {
    return CHANNEL
  },
  get version() {
    return VERSION
  },
  get preview() {
    return IS_PREVIEW
  },
  get release(): boolean {
    return !!env.ZETHCODE_RELEASE
  },
}
console.log(`zethcode script`, JSON.stringify(Script, null, 2))
