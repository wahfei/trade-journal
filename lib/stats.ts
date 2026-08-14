import type { Trade } from './types'

export interface TradeStats {
  count: number
  netPnl: number
  wins: number
  losses: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number | null
  best: number
  worst: number
}

export function computeStats(trades: Trade[]): TradeStats {
  const count = trades.length
  const winners = trades.filter((t) => t.pnl > 0)
  const losers = trades.filter((t) => t.pnl < 0)
  const grossProfit = winners.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0))
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0)

  return {
    count,
    netPnl,
    wins: winners.length,
    losses: losers.length,
    winRate: count ? (winners.length / count) * 100 : 0,
    avgWin: winners.length ? grossProfit / winners.length : 0,
    avgLoss: losers.length ? grossLoss / losers.length : 0,
    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? null : 0) : grossProfit / grossLoss,
    best: count ? Math.max(...trades.map((t) => t.pnl)) : 0,
    worst: count ? Math.min(...trades.map((t) => t.pnl)) : 0,
  }
}

export function formatCurrency(n: number, withSign = false): string {
  const sign = n > 0 && withSign ? '+' : ''
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${n < 0 ? '-' : sign}$${formatted}`
}
