export function label(value: string) {
  return value.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "").trim() || "Unnamed"
}
