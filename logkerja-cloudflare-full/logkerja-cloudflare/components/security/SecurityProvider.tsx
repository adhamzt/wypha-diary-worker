'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { LockKeyhole, ScanFace, ShieldCheck } from 'lucide-react'
import { db } from '@/lib/db/db'
import { ensureBootstrap } from '@/lib/db/bootstrap'
import { clearSessionKey, loadSessionKey, saveSessionKey, unlockWithBiometric, unlockWithPin } from '@/lib/crypto/vault'
import type { AppSettings } from '@/types'

type SecurityContextValue = {
  key: CryptoKey | null
  settings: AppSettings | null
  locked: boolean
  ready: boolean
  refreshSettings: () => Promise<void>
  setUnlockedKey: (key: CryptoKey) => Promise<void>
  lock: () => void
}

const SecurityContext = createContext<SecurityContextValue | null>(null)

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [ready, setReady] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const lastActivity = useRef(Date.now())

  const refreshSettings = useCallback(async () => {
    await ensureBootstrap()
    setSettings((await db.settings.get('app')) || null)
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      await ensureBootstrap()
      const next = (await db.settings.get('app')) || null
      if (!active) return
      setSettings(next)
      if (next?.security?.enabled) {
        const sessionKey = await loadSessionKey()
        if (active && sessionKey) setKey(sessionKey)
      }
      if (active) setReady(true)
    })()
    return () => { active = false }
  }, [])

  const lock = useCallback(() => {
    setKey(null)
    clearSessionKey()
  }, [])

  const setUnlockedKey = useCallback(async (next: CryptoKey) => {
    setKey(next)
    lastActivity.current = Date.now()
    await saveSessionKey(next)
  }, [])

  useEffect(() => {
    if (!settings?.security?.enabled || !key) return
    const bump = () => { lastActivity.current = Date.now() }
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart']
    events.forEach((event) => window.addEventListener(event, bump, { passive: true }))
    const timer = window.setInterval(() => {
      const timeout = Math.max(1, settings.security?.autoLockMin || 5) * 60_000
      if (Date.now() - lastActivity.current > timeout) lock()
    }, 15_000)
    return () => {
      events.forEach((event) => window.removeEventListener(event, bump))
      window.clearInterval(timer)
    }
  }, [key, lock, settings?.security])

  async function unlockPin() {
    if (!settings?.security) return
    setUnlocking(true); setError('')
    try {
      const unlocked = await unlockWithPin(pin, settings.security)
      await setUnlockedKey(unlocked)
      setPin('')
    } catch {
      setError('PIN salah atau data vault tidak dapat dibuka.')
    } finally { setUnlocking(false) }
  }

  async function unlockBio() {
    if (!settings?.security?.biometric) return
    setUnlocking(true); setError('')
    try {
      const unlocked = await unlockWithBiometric(settings.security.biometric)
      await setUnlockedKey(unlocked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biometric gagal. Gunakan PIN.')
    } finally { setUnlocking(false) }
  }

  const locked = Boolean(ready && settings?.security?.enabled && !key)
  const value = useMemo(() => ({ key, settings, locked, ready, refreshSettings, setUnlockedKey, lock }), [key, settings, locked, ready, refreshSettings, setUnlockedKey, lock])

  return (
    <SecurityContext.Provider value={value}>
      {children}
      {locked && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/80 p-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="LogKerja terkunci">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950"><LockKeyhole size={28} /></div>
            <h2 className="mt-4 text-center text-2xl font-black">LogKerja terkunci</h2>
            <p className="mt-2 text-center text-sm leading-6 text-slate-500">Catatan terenkripsi. Buka vault untuk membaca dan menulis diary.</p>
            {settings?.security?.biometric && (
              <button disabled={unlocking} onClick={() => void unlockBio()} className="btn-primary mt-5 w-full"><ScanFace size={19} /> Buka dengan biometric</button>
            )}
            <div className="mt-4">
              <label className="label" htmlFor="unlock-pin">PIN</label>
              <input id="unlock-pin" inputMode="numeric" type="password" autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void unlockPin() }} className="field text-center text-xl tracking-[.35em]" placeholder="••••••" />
              <button disabled={unlocking || pin.length < 6} onClick={() => void unlockPin()} className="btn-secondary mt-3 w-full"><ShieldCheck size={18} /> {unlocking ? 'Membuka…' : 'Buka dengan PIN'}</button>
            </div>
            {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700">{error}</p>}
          </div>
        </div>
      )}
    </SecurityContext.Provider>
  )
}

export function useSecurity() {
  const value = useContext(SecurityContext)
  if (!value) throw new Error('useSecurity must be used inside SecurityProvider')
  return value
}
