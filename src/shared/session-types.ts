export type SessionSummary = {
  id: string
  title: string | null
  directory: string
  timeCreated: number
  timeUpdated: number
  timeArchived: number | null
  messageCount: number
}
