'use client'

import type { TradeStats } from '@/lib/stats'
import { formatCurrency } from '@/lib/stats'
import { cn } from '@/lib/utils'

function Stat({
  label,
  value,
  tone = 'neutral',
  hint,
}: {
  label: string
  value: string
  tone?: 'neutral' | 'profit' | 'loss'
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <div
        className={cn(
          'mt-2 font-mono text-2xl tabular-nums',
          tone === 'profit' && 'text-profit',
          tone === 'loss' && 'text-loss',
          tone === 'neutral' && 'text-foreground',
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  )
}

export function StatsOverview({ stats }: { stats: TradeStats }) {
  const pf =
    stats.profitFactor === null
      ? '∞'
      : stats.count === 0
        ? '—'
        : stats.profitFactor.toFixed(2)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        label="Net P&L"
        value={stats.count ? formatCurrency(stats.netPnl, true) : '—'}
        tone={stats.netPnl > 0 ? 'profit' : stats.netPnl < 0 ? 'loss' : 'neutral'}
        hint={`${stats.count} trade${stats.count === 1 ? '' : 's'}`}
      />
      <Stat
        label="Win Rate"
        value={stats.count ? `${stats.winRate.toFixed(0)}%` : '—'}
        hint={stats.count ? `${stats.wins}W · ${stats.losses}L` : undefined}
      />
      <Stat
        label="Profit Factor"
        value={pf}
        hint="gross win / gross loss"
      />
      <Stat
        label="Avg Win / Loss"
        value={
          stats.count
            ? `${formatCurrency(stats.avgWin)} / ${formatCurrency(-stats.avgLoss)}`
            : '—'
        }
        hint={
          stats.count
            ? `best ${formatCurrency(stats.best, true)} · worst ${formatCurrency(stats.worst, true)}`
            : undefined
        }
      />
    </div>
  )
}
