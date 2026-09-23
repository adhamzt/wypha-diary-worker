'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, RotateCcw, TimerReset } from 'lucide-react'
import { useSecurity } from '@/components/security/SecurityProvider'
import { createEntry } from '@/lib/repository/entries'
import { localDateKey } from '@/lib/date'

const STORAGE = 'logkerja-focus-session'

type Stored = { endAt: number; plannedMin: number; project: string; running: boolean; remainingMs?: number }

export function FocusTimer() {
  const { key, locked } = useSecurity()
  const [minutes, setMinutes] = useState(25)
  const [project, setProject] = useState('')
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE)
    if (!raw) return
    try {
      const data = JSON.parse(raw) as Stored
      setProject(data.project || '')
      setMinutes(data.plannedMin || 25)
      if (data.running) {
        const sec = Math.max(0, Math.ceil((data.endAt - Date.now()) / 1000))
        setRemaining(sec); setRunning(sec > 0)
      } else if (data.remainingMs) setRemaining(Math.ceil(data.remainingMs / 1000))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (remaining !== 0 || !running) return
    setRunning(false)
    localStorage.removeItem(STORAGE)
    if (!locked) {
      void createEntry({
        date: localDateKey(), project: project || 'Focus Session', activity: `Focus session ${minutes} menit selesai`,
        mood: 4, durationMin: minutes, tags: ['focus'], files: [], syncedAt: null
      }, key).then(() => setDone('Focus session otomatis tercatat di Timeline.'))
    }
  }, [remaining, running, locked, key, minutes, project])

  const clock = useMemo(() => `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`, [remaining])

  function start() {
    const next = remaining > 0 ? remaining : minutes * 60
    setRemaining(next); setRunning(true); setDone('')
    localStorage.setItem(STORAGE, JSON.stringify({ endAt: Date.now() + next * 1000, plannedMin: minutes, project, running: true } satisfies Stored))
  }
  function pause() {
    setRunning(false)
    localStorage.setItem(STORAGE, JSON.stringify({ endAt: 0, plannedMin: minutes, project, running: false, remainingMs: remaining * 1000 } satisfies Stored))
  }
  function reset() {
    setRunning(false); setRemaining(minutes * 60); localStorage.removeItem(STORAGE); setDone('')
  }

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div><p className="eyebrow">FOCUS SESSION</p><h2 className="mt-1 font-black">Pomodoro → otomatis jadi log</h2></div>
        <TimerReset className="text-indigo-500" />
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <input className="field" value={project} onChange={(e) => setProject(e.target.value)} placeholder="Proyek / fokus (opsional)" />
        <select className="field !w-24" value={minutes} onChange={(e) => { const m = Number(e.target.value); setMinutes(m); if (!running) setRemaining(m * 60) }} disabled={running}>
          {[15,25,45,60].map((m) => <option key={m} value={m}>{m}m</option>)}
        </select>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-white dark:bg-black">
        <span className="font-mono text-3xl font-black tracking-wider">{clock}</span>
        <div className="flex gap-2">
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-white/10" onClick={running ? pause : start} aria-label={running ? 'Pause' : 'Mulai'}>{running ? <Pause size={18}/> : <Play size={18}/>}</button>
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-white/10" onClick={reset} aria-label="Reset"><RotateCcw size={18}/></button>
        </div>
      </div>
      {done && <p className="mt-3 text-xs font-semibold text-emerald-600">{done}</p>}
    </section>
  )
}
