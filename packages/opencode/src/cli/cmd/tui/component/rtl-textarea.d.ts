import type { RTLTextareaRenderable } from "./rtl-textarea"

declare module "@opentui/solid/src/types/elements.js" {
  interface OpenTUIComponents {
    rtl_textarea: typeof RTLTextareaRenderable
  }
}
