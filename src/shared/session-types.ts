export type SessionSummary = {
  id: string
  title: string | null
  directory: string
  timeCreated: number
  timeUpdated: number
  timeArchived: number | null
  messageCount: number
  // 当前上下文规模：最后一条带 tokens 的 assistant 消息的 input + cache.read + cache.write
  contextSize: number
}
