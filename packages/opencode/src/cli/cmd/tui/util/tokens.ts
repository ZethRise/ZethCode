import type { AssistantMessage } from "@zethrise/sdk/v2"

export function messageTokenCount(msg: AssistantMessage) {
  return (
    msg.tokens.total ??
    msg.tokens.input + msg.tokens.output + msg.tokens.reasoning + msg.tokens.cache.read + msg.tokens.cache.write
  )
}
