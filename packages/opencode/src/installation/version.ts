declare global {
  const ZETHCODE_VERSION: string
  const ZETHCODE_CHANNEL: string
}

export const InstallationVersion = typeof ZETHCODE_VERSION === "string" ? ZETHCODE_VERSION : "local"
export const InstallationChannel = typeof ZETHCODE_CHANNEL === "string" ? ZETHCODE_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
