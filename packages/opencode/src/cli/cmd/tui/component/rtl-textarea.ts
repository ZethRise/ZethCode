import { TextareaRenderable, type OptimizedBuffer, type RenderContext, type TextareaOptions } from "@opentui/core"
import { hasRTL, rtlVisual, rtlVisualWithCursor } from "../util/rtl"

export class RTLTextareaRenderable extends TextareaRenderable {
  private rtlCursor = { x: 0, y: 0 }

  constructor(ctx: RenderContext, options: TextareaOptions) {
    super(ctx, options)
  }

  private textWidth(text: string) {
    return Array.from(text).length
  }

  private drawCompactText(buffer: OptimizedBuffer, text: string, x: number, y: number) {
    Array.from(text).forEach((char, index) => {
      buffer.setCell(x + index, y, char, this.textColor, this._backgroundColor)
    })
  }

  protected override renderSelf(buffer: OptimizedBuffer) {
    if (!hasRTL(this.plainText)) {
      super.renderSelf(buffer)
      return
    }

    buffer.fillRect(this.x, this.y, this.width, this.height, this._backgroundColor)
    this.plainText.split("\n").slice(0, this.height).forEach((line, y) => {
      const cursor = this.logicalCursor.row === y ? this.logicalCursor.col : -1
      const text = rtlVisual(line)
      const x = this.x + Math.max(1, this.width - this.textWidth(text) - 1)

      this.drawCompactText(buffer, text, x, this.y + y)
      if (cursor >= 0) {
        const visual = rtlVisualWithCursor(line, cursor)
        this.rtlCursor = { x: x + this.textWidth(visual.before), y }
      }
    })
  }

  protected override renderCursor(buffer: OptimizedBuffer) {
    if (!hasRTL(this.plainText)) {
      super.renderCursor(buffer)
      return
    }
    if (!this.focused) return
    this.ctx.setCursorPosition(this.rtlCursor.x + 1, this.y + this.rtlCursor.y + 1, true)
  }
}
