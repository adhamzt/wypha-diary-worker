'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowRight, BarChart3, BookOpenCheck, Flame, HelpCircle, Plus, ShieldCheck, Sparkles } from 'lucide-react'
import { InstallCard } from './InstallCard'
import { FocusTimer } from './FocusTimer'
import { localDateKey } from '@/lib/date'
import { useEntries } from '@/hooks/useEntries'
import { useSecurity } from './security/SecurityProvider'
import { calculateStreak } from '@/lib/stats/stats'
import { useAutoWeeklyRecap } from '@/hooks/useAutoWeeklyRecap'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(`${date}T00:00:00`))
}

export function HomeDashboard() {
  const entries = useEntries()
  const { settings } = useSecurity()
  const today = localDateKey()
  const active = entries.filter((e) => !e.archived)
  const todayEntries = active.filter((e) => e.date === today)
  const recent = active.slice(0, 3)
  const streak = calculateStreak(active)
  useAutoWeeklyRecap(active)
  const lowMoodNudge = (() => {
    const byDate = new Map<string, number[]>()
    for (const e of active) { const a = byDate.get(e.date) || []; a.push(e.mood); byDate.set(e.date, a) }
    const last = [...byDate.entries()].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,3)
    return last.length === 3 && last.every(([,m]) => m.reduce((a,b)=>a+b,0)/m.length <= 2)
  })()

  useEffect(() => {
    if (settings && !settings.onboardingComplete && location.pathname === '/') location.replace('/onboarding/')
  }, [settings])

  return (
    <main className="app-shell space-y-5">
      <header className="pt-2">
        <div className="flex items-start justify-between gap-3">
          <div><p className="eyebrow">WORKDIARY · LOCAL FIRST</p><h1 className="mt-1 text-3xl font-black tracking-tight">LogKerja</h1></div>
          <Link href="/help/" className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-500 shadow-sm dark:bg-slate-900"><HelpCircle size={20}/></Link>
        </div>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Catat bukti kerja hari ini, supaya progres kecil tidak hilang saat waktunya review.</p>
      </header>

      <Link href="/add/" className="card block overflow-hidden border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-xl shadow-indigo-200/70 dark:shadow-none">
        <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-100">Input cepat &lt; 10 detik</p><h2 className="mt-1 text-2xl font-black">Catat Sekarang</h2><p className="mt-2 text-sm text-indigo-100">Aktivitas + mood dulu. Detail lain bisa menyusul.</p></div><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-indigo-600 shadow-lg"><Plus size={30} strokeWidth={2.5}/></span></div>
      </Link>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4"><BookOpenCheck className="text-indigo-600" size={22}/><p className="mt-3 text-3xl font-black">{todayEntries.length}</p><p className="text-xs text-slate-500">hari ini</p></div>
        <div className="card p-4"><Flame className="text-amber-500" size={22}/><p className="mt-3 text-3xl font-black">{streak}</p><p className="text-xs text-slate-500">hari streak</p></div>
        <Link href="/analytics/" className="card p-4"><BarChart3 className="text-emerald-600" size={22}/><p className="mt-3 text-3xl font-black">{active.length}</p><p className="text-xs text-slate-500">total log</p></Link>
      </div>

      {settings?.security?.enabled && <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"><ShieldCheck size={17}/> Vault AES-GCM aktif · auto-lock {settings.security.autoLockMin} menit</div>}

      {lowMoodNudge && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><b>3 hari terakhir terasa berat.</b> Coba cek apakah ada beban atau masalah kerja yang berulang, pilih satu hal yang bisa ditunda/delegasikan, dan beri ruang untuk istirahat. Ini nudge refleksi, bukan penilaian kesehatan.</div>}
      <InstallCard />
      <FocusTimer />

      <Link href="/insights/" className="card flex items-center justify-between gap-4 p-5"><div><p className="eyebrow">REFLECTION ENGINE</p><h2 className="mt-1 font-black">Ubah catatan menjadi insight</h2><p className="mt-1 text-sm text-slate-500">Weekly summary, brag document, pattern detector, review prep.</p></div><Sparkles className="shrink-0 text-violet-500" size={28}/></Link>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">Catatan terbaru</h2><Link href="/timeline/" className="flex items-center gap-1 text-sm font-bold text-indigo-600">Lihat semua <ArrowRight size={15}/></Link></div>
        <div className="space-y-3">{recent.length === 0 ? <div className="card p-6 text-center"><p className="font-bold">Belum ada catatan.</p><p className="mt-1 text-sm text-slate-500">Catatan pertama Anda akan muncul di sini.</p></div> : recent.map((entry) => <Link href={`/entry/?id=${encodeURIComponent(entry.id)}`} key={entry.id} className="card block p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{entry.project || 'Tanpa proyek'}</p><p className="mt-1 line-clamp-2 font-semibold leading-6">{entry.activity}</p></div><span className="shrink-0 text-xs font-semibold text-slate-400">{formatDate(entry.date)}</span></div></Link>)}</div>
      </section>
    </main>
  )
}
