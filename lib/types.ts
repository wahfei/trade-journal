export type Direction = 'long' | 'short'

export interface Trade {
  id: string
  symbol: string
  direction: Direction
  entry: number
  exit: number
  size: number
  pnl: number
  date: string // ISO date string (yyyy-mm-dd)
  tags: string[]
  notes: string
  image?: string // data URL of a chart screenshot
  createdAt: number
}

export type NewTrade = Omit<Trade, 'id' | 'createdAt'>
