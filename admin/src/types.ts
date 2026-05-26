export type PostType = 'normal' | 'special' | 'closed'
export type StockFolder = 'normal' | 'special' | 'seasonal'

export interface StockFile {
  name: string
  url: string
  fullPath: string
}

export interface DayData {
  date?: string
  type?: PostType
  open_time?: string
  custom_text?: string
  mentions?: string[]
  image_url?: string
  updated_at?: unknown
}
