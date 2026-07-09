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

  private drawCompactText(buffer: OptimizedBuffer, text: string, x: number, y: number, width: number) {
    Array.from(text)
      .slice(0, width)
      .forEach((char, index) => {
        buffer.setCell(x + index, y, char, this.textColor, this._backgroundColor)
      })
  }

  private wrapLine(line: string, width: number) {
    const chars = Array.from(line)
    if (chars.length === 0) return [""]
    return Array.from({ length: Math.ceil(chars.length / width) }, (_, index) =>
      chars.slice(index * width, (index + 1) * width).join(""),
    )
  }

  protected override renderSelf(buffer: OptimizedBuffer) {
    if (!hasRTL(this.plainText)) {
      super.renderSelf(buffer)
      return
    }

    buffer.fillRect(this.x, this.y, this.width, this.height, this._backgroundColor)
    const width = Math.max(1, this.width - 2)
    const rows = this.plainText.split("\n").flatMap((line, row) =>
      this.wrapLine(line, width).map((text, wrap) => ({ text, row, wrap })),
    )
    const cursorWrap = Math.min(
      Math.floor(this.logicalCursor.col / width),
      Math.max(0, rows.filter((row) => row.row === this.logicalCursor.row).length - 1),
    )
    const cursorRow = rows.findIndex((row) => row.row === this.logicalCursor.row && row.wrap === cursorWrap)
    const offset = Math.max(0, Math.min(cursorRow < 0 ? 0 : cursorRow, rows.length - this.height))

    rows.slice(offset, offset + this.height).forEach((row, y) => {
      const cursor =
        this.logicalCursor.row === row.row && cursorWrap === row.wrap
          ? this.logicalCursor.col >= (cursorWrap + 1) * width
            ? width
            : this.logicalCursor.col % width
          : -1
      const text = rtlVisual(row.text)
      const drawWidth = Math.max(0, this.width - 2)
      const x = this.x + Math.max(1, this.width - Math.min(this.textWidth(text), drawWidth) - 1)

      this.drawCompactText(buffer, text, x, this.y + y, drawWidth)
      if (cursor >= 0) {
        const visual = rtlVisualWithCursor(row.text, cursor)
        this.rtlCursor = { x: Math.min(x + this.textWidth(visual.before), this.x + this.width - 1), y }
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
