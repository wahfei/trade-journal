'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Direction, NewTrade } from '@/lib/types'
import { fileToCompressedDataUrl } from '@/lib/image'
import { cn } from '@/lib/utils'
import { ImagePlus, Loader2, X } from 'lucide-react'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY = {
  symbol: '',
  entry: '',
  exit: '',
  size: '',
  pnl: '',
  date: todayIso(),
  tags: '',
  notes: '',
}

export function TradeForm({
  onAdd,
  onCancel,
}: {
  onAdd: (trade: NewTrade) => void
  onCancel: () => void
}) {
  const [direction, setDirection] = useState<Direction>('long')
  const [values, setValues] = useState({ ...EMPTY })
  const [image, setImage] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof typeof values>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  async function handleImageFile(file: File | Blob | undefined | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image.')
      return
    }
    setImageLoading(true)
    setError(null)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setImage(dataUrl)
    } catch {
      setError('Could not process that image.')
    } finally {
      setImageLoading(false)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith('image/'),
    )
    if (item) {
      e.preventDefault()
      handleImageFile(item.getAsFile())
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.symbol.trim()) {
      setError('Symbol is required.')
      return
    }
    if (values.pnl === '' || Number.isNaN(Number(values.pnl))) {
      setError('Enter a numeric P&L for this trade.')
      return
    }

    const trade: NewTrade = {
      symbol: values.symbol.trim().toUpperCase(),
      direction,
      entry: Number(values.entry) || 0,
      exit: Number(values.exit) || 0,
      size: Number(values.size) || 0,
      pnl: Number(values.pnl),
      date: values.date || todayIso(),
      tags: values.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      notes: values.notes.trim(),
      ...(image ? { image } : {}),
    }
    onAdd(trade)
    setValues({ ...EMPTY, date: values.date })
    setDirection('long')
    setImage(null)
    setError(null)
  }

  return (
    <form
      onSubmit={handleSubmit}
      onPaste={handlePaste}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="symbol">Symbol</Label>
          <Input
            id="symbol"
            placeholder="EUR/USD"
            autoComplete="off"
            value={values.symbol}
            onChange={(e) => set('symbol', e.target.value)}
            className="font-mono uppercase"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Direction</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['long', 'short'] as Direction[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                className={cn(
                  'h-9 rounded-lg border text-sm font-medium capitalize transition-colors',
                  direction === d
                    ? d === 'long'
                      ? 'border-profit/50 bg-profit/15 text-profit'
                      : 'border-loss/50 bg-loss/15 text-loss'
                    : 'border-input bg-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={values.date}
            onChange={(e) => set('date', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="entry">Entry price</Label>
          <Input
            id="entry"
            inputMode="decimal"
            placeholder="1.0850"
            value={values.entry}
            onChange={(e) => set('entry', e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="exit">Exit price</Label>
          <Input
            id="exit"
            inputMode="decimal"
            placeholder="1.0920"
            value={values.exit}
            onChange={(e) => set('exit', e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="size">Size (lots / units)</Label>
          <Input
            id="size"
            inputMode="decimal"
            placeholder="1.0"
            value={values.size}
            onChange={(e) => set('size', e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pnl">P&amp;L ($)</Label>
          <Input
            id="pnl"
            inputMode="decimal"
            placeholder="e.g. 240 or -85"
            value={values.pnl}
            onChange={(e) => set('pnl', e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="breakout, london-open (comma separated)"
            autoComplete="off"
            value={values.tags}
            onChange={(e) => set('tags', e.target.value)}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="What was the setup? How did you manage the trade?"
            value={values.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
          <Label>Chart screenshot</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              handleImageFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          {image ? (
            <div className="relative w-fit overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image || '/placeholder.svg'}
                alt="Trade chart screenshot preview"
                className="max-h-56 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label="Remove screenshot"
                className="absolute right-2 top-2 rounded-md bg-background/80 p-1 text-muted-foreground backdrop-blur transition-colors hover:text-loss"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLoading}
              className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-transparent text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:opacity-60"
            >
              {imageLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <ImagePlus className="size-4" />
                  Upload or paste a chart screenshot
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-loss">{error}</p> : null}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add trade</Button>
      </div>
    </form>
  )
}
