export type PostType = 'normal' | 'special' | 'closed'

export interface DayData {
  date?: string
  type?: PostType
  open_time?: string
  custom_text?: string
  mentions?: string[]
  image_url?: string
  updated_at?: unknown
}
