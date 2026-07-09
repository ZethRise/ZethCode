import bidiFactory from "bidi-js"
import reshaper from "arabic-persian-reshaper"

const RTL_RE = /[\u0590-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/
const STRONG_RE = /[A-Za-z\u0590-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/
const FENCE_RE = /^\s*(```|~~~)/
const CURSOR_MARK = "\ue000"
const TATWEEL = "\u0640"
const LEFT_JOINING_RE = /[\u0626\u0628\u067e\u062a\u062b\u062c\u0686\u062d\u062e\u0633\u0634\u0635\u0636\u0637\u0638\u0639\u063a\u0641\u0642\u0643\u06a9\u06af\u0644\u0645\u0646\u0647\u064a\u06cc]/
const RIGHT_JOINING_RE = /[\u0622-\u063a\u0640-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/
const bidi = bidiFactory()

export function hasRTL(text: string) {
  return RTL_RE.test(text)
}

export function isRTL(text: string) {
  return RTL_RE.test(text.match(STRONG_RE)?.[0] ?? "")
}

function elongateJoins(line: string) {
  return Array.from(line)
    .map((char, index, chars) =>
      LEFT_JOINING_RE.test(char) && RIGHT_JOINING_RE.test(chars[index + 1] ?? "") ? char + TATWEEL : char,
    )
    .join("")
}

function reorderLine(line: string, options?: { elongate?: boolean }) {
  const shaped = reshaper.PersianShaper.convertArabic(options?.elongate ? elongateJoins(line) : line)
  const embedding = bidi.getEmbeddingLevels(shaped, isRTL(line) ? "rtl" : "ltr")
  const chars = shaped.split("")

  for (const [index, char] of bidi.getMirroredCharactersMap(shaped, embedding)) {
    chars[index] = char
  }

  for (const [start, end] of bidi.getReorderSegments(shaped, embedding)) {
    chars.splice(start, end - start + 1, ...chars.slice(start, end + 1).reverse())
  }

  return chars.join("")
}

export function rtlVisual(text: string, options?: { elongate?: boolean }) {
  if (!hasRTL(text)) return text
  let fenced = false
  return text
    .split("\n")
    .map((line) => {
      if (FENCE_RE.test(line)) {
        fenced = !fenced
        return line
      }
      if (fenced || !hasRTL(line)) return line
      return reorderLine(line, options)
    })
    .join("\n")
}

export function rtlVisualWithCursor(text: string, offset: number, options?: { elongate?: boolean }) {
  const visual = rtlVisual(text.slice(0, offset) + CURSOR_MARK + text.slice(offset), options)
  const index = visual.indexOf(CURSOR_MARK)
  if (index === -1) return { before: rtlVisual(text, options), after: "" }
  return {
    before: visual.slice(0, index),
    after: visual.slice(index + CURSOR_MARK.length),
  }
}
