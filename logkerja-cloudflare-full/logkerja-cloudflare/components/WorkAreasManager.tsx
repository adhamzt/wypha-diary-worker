'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Archive, FolderPlus, Pencil, RotateCcw } from 'lucide-react'
import { useEntries } from '@/hooks/useEntries'
import { useWorkAreas } from '@/hooks/useWorkAreas'
import { AREA_COLORS, areaId, GENERAL_AREA_ID, saveWorkArea, setWorkAreaArchived } from '@/lib/work-areas'

export function WorkAreasManager() {
  const areas = useWorkAreas()
  const entries = useEntries().filter(entry => !entry.archived)
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(AREA_COLORS[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const totalMin = entries.reduce((sum, entry) => sum + (entry.durationMin || 0), 0)

  async function save() {
    setBusy(true); setError('')
    try { await saveWorkArea(name, color, editing || undefined); setEditing(null); setName(''); setColor(AREA_COLORS[0]) }
    catch (err) { setError(err instanceof Error ? err.message : 'Gagal menyimpan jenis pekerjaan.') }
    finally { setBusy(false) }
  }
  async function toggle(id: string, archived: boolean) {
    try { setError(''); await setWorkAreaArchived(id, archived) }
    catch (err) { setError(err instanceof Error ? err.message : 'Gagal mengubah jenis pekerjaan.') }
  }

  return <main className="app-shell space-y-4">
    <header className="pt-2"><p className="eyebrow">SELURUH PEKERJAAN</p><h1 className="mt-1 text-3xl font-black">Jenis Pekerjaan</h1><p className="mt-2 text-sm leading-6 text-slate-500">Satu diary untuk semua peran. Proyek dan klien tetap dicatat di dalam setiap log.</p></header>
    <Link href="/timeline/" className="card block border-indigo-200 bg-indigo-50 p-5 dark:bg-indigo-950/30"><p className="text-xs font-black uppercase tracking-wide text-indigo-600">Global · Semua pekerjaan</p><p className="mt-2 text-3xl font-black">{entries.length} log</p><p className="text-sm text-slate-500">{(totalMin / 60).toFixed(1)} jam tercatat · Lihat seluruh timeline →</p></Link>
    <section className="card p-5"><div className="flex items-center gap-2"><FolderPlus size={19} className="text-indigo-600"/><h2 className="font-black">{editing ? 'Ubah jenis pekerjaan' : 'Buat jenis pekerjaan'}</h2></div>
      <input className="field mt-3" value={name} onChange={event => setName(event.target.value)} maxLength={50} placeholder="Contoh: Administratif, Desainer, Rumah" aria-label="Nama jenis pekerjaan"/>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Pilih warna">{AREA_COLORS.map(value => <button key={value} type="button" onClick={() => setColor(value)} className={`h-9 w-9 rounded-full border-4 ${color === value ? 'border-slate-900 dark:border-white' : 'border-transparent'}`} style={{backgroundColor:value}} aria-label={`Warna ${value}`} aria-pressed={color === value}/>)}</div>
      <div className="mt-4 flex gap-2"><button className="btn-primary flex-1" onClick={() => void save()} disabled={busy || !name.trim()}>{busy ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah pekerjaan'}</button>{editing && <button className="btn-secondary" onClick={() => {setEditing(null);setName('');setError('')}}>Batal</button>}</div>
      {error && <p className="mt-3 text-sm font-semibold text-rose-600" role="alert">{error}</p>}
    </section>
    <section className="space-y-3"><h2 className="font-black">Folder pekerjaan</h2>{areas.map(area => {
      const logs = entries.filter(entry => areaId(entry) === area.id)
      const minutes = logs.reduce((sum, entry) => sum + (entry.durationMin || 0), 0)
      return <div key={area.id} className={`card p-4 ${area.archived ? 'opacity-65' : ''}`}><div className="flex items-start gap-3"><span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{backgroundColor:area.color}}/><div className="min-w-0 flex-1"><h3 className="font-black">{area.name}{area.archived && <span className="ml-2 text-xs font-medium text-slate-400">Diarsipkan</span>}</h3><p className="text-xs text-slate-500">{logs.length} log · {(minutes/60).toFixed(1)} jam</p></div></div>
        <div className="mt-3 flex flex-wrap gap-2"><Link className="btn-secondary !min-h-9 !px-3 text-xs" href={`/timeline/?area=${encodeURIComponent(area.id)}`}>Lihat log</Link><Link className="btn-secondary !min-h-9 !px-3 text-xs" href={`/analytics/?area=${encodeURIComponent(area.id)}`}>Analitik</Link>{!area.archived && <Link className="btn-secondary !min-h-9 !px-3 text-xs" href={`/add/?area=${encodeURIComponent(area.id)}`}>+ Catat</Link>}
          {area.id !== GENERAL_AREA_ID && <><button className="btn-secondary !min-h-9 !px-3 text-xs" onClick={() => {setEditing(area.id);setName(area.name);setColor(area.color);setError('');window.scrollTo({top:0,behavior:'smooth'})}}><Pencil size={13}/>Ubah</button><button className="btn-secondary !min-h-9 !px-3 text-xs" onClick={() => void toggle(area.id, !area.archived)}>{area.archived ? <RotateCcw size={13}/> : <Archive size={13}/>}{area.archived ? 'Aktifkan' : 'Arsipkan'}</button></>}</div>
      </div>
    })}</section>
  </main>
}
