import { describe, expect, test } from "bun:test"
import { hasRTL, isRTL, rtlVisual } from "../../src/cli/cmd/tui/util/rtl"

describe("tui rtl helpers", () => {
  test("keeps mixed English-leading lines left-to-right", () => {
    const text = "hello سلام world"

    expect(hasRTL(text)).toBe(true)
    expect(isRTL(text)).toBe(false)
    expect(rtlVisual(text).startsWith("hello ")).toBe(true)
    expect(rtlVisual(text).endsWith(" world")).toBe(true)
  })

  test("uses right-to-left base for Persian-leading lines", () => {
    expect(isRTL("سلام hello")).toBe(true)
  })
})
