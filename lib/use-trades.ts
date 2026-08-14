'use client'

import { useCallback, useEffect, useState } from 'react'
import type { NewTrade, Trade } from './types'

const STORAGE_KEY = 'tape.trades.v1'

function readStorage(): Trade[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Trade[]
  } catch {
    return []
  }
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTrades(readStorage())
    setLoaded(true)
  }, [])

  // Persist whenever trades change (after initial load).
  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trades))
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [trades, loaded])

  // Sync across tabs.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setTrades(readStorage())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addTrade = useCallback((data: NewTrade) => {
    const trade: Trade = {
      ...data,
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      createdAt: Date.now(),
    }
    setTrades((prev) => [trade, ...prev])
  }, [])

  const deleteTrade = useCallback((id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearAll = useCallback(() => setTrades([]), [])

  return { trades, loaded, addTrade, deleteTrade, clearAll }
}
