'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/stats'
import type { Trade } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight, Trash2, X } from 'lucide-react'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function TradeList({
  trades,
  onDelete,
}: {
  trades: Trade[]
  onDelete: (id: string) => void
}) {
  const [zoomed, setZoomed] = useState<Trade | null>(null)

  useEffect(() => {
    if (!zoomed) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setZoomed(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomed])

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
        <p className="text-sm font-medium text-foreground">No trades logged yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first trade to start building your journal and P&amp;L stats.
        </p>
      </div>
    )
  }

  return (
    <>
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Exit</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="text-right">P&amp;L</TableHead>
              <TableHead>Chart</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((t) => (
              <TableRow key={t.id} className="group align-top">
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(t.date)}
                </TableCell>
                <TableCell className="font-mono font-medium text-foreground">
                  {t.symbol}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium capitalize',
                      t.direction === 'long' ? 'text-profit' : 'text-loss',
                    )}
                  >
                    {t.direction === 'long' ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                    {t.direction}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {t.entry || '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {t.exit || '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {t.size || '—'}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-mono font-medium tabular-nums',
                    t.pnl > 0 && 'text-profit',
                    t.pnl < 0 && 'text-loss',
                    t.pnl === 0 && 'text-muted-foreground',
                  )}
                >
                  {formatCurrency(t.pnl, true)}
                </TableCell>
                <TableCell>
                  {t.image ? (
                    <button
                      type="button"
                      onClick={() => setZoomed(t)}
                      aria-label={`View ${t.symbol} chart screenshot`}
                      className="block overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.image || '/placeholder.svg'}
                        alt=""
                        className="h-10 w-16 object-cover"
                      />
                    </button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex max-w-48 flex-wrap gap-1">
                    {t.tags.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      t.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="font-normal">
                          {tag}
                        </Badge>
                      ))
                    )}
                    {t.notes ? (
                      <span
                        className="block w-full text-xs text-muted-foreground"
                        title={t.notes}
                      >
                        {t.notes.length > 60 ? t.notes.slice(0, 60) + '…' : t.notes}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onDelete(t.id)}
                    aria-label={`Delete ${t.symbol} trade`}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-loss group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>

    {zoomed?.image ? (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${zoomed.symbol} chart screenshot`}
        onClick={() => setZoomed(null)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={() => setZoomed(null)}
          aria-label="Close preview"
          className="absolute right-4 top-4 rounded-md bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        <figure
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-full max-w-4xl flex-col gap-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomed.image || '/placeholder.svg'}
            alt={`${zoomed.symbol} chart screenshot`}
            className="max-h-[80vh] w-auto rounded-lg border border-border object-contain"
          />
          <figcaption className="text-center font-mono text-sm text-muted-foreground">
            {zoomed.symbol} · {formatDate(zoomed.date)} ·{' '}
            <span
              className={cn(
                zoomed.pnl > 0 && 'text-profit',
                zoomed.pnl < 0 && 'text-loss',
              )}
            >
              {formatCurrency(zoomed.pnl, true)}
            </span>
          </figcaption>
        </figure>
      </div>
    ) : null}
    </>
  )
}
