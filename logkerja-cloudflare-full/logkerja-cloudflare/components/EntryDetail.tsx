'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Archive, Copy, Download, History, Save, Star, Trash2 } from 'lucide-react'
import { useSecurity } from '@/components/security/SecurityProvider'
import { deleteEntry, duplicateEntry, getAttachmentBlob, getEntry, listHistory, updateEntry } from '@/lib/repository/entries'
import type { Mood, WorkEntry } from '@/types'

const moods: Array<{value:Mood;emoji:string}> = [{value:1,emoji:'😣'},{value:2,emoji:'😕'},{value:3,emoji:'😐'},{value:4,emoji:'🙂'},{value:5,emoji:'🚀'}]

export function EntryDetail() {
  const router=useRouter(); const search=useSearchParams(); const id=search.get('id')||''; const {key,locked}=useSecurity()
  const [entry,setEntry]=useState<WorkEntry|null>(null); const [history,setHistory]=useState<WorkEntry[]>([]); const [showHistory,setShowHistory]=useState(false); const [message,setMessage]=useState(''); const [loading,setLoading]=useState(true)
  useEffect(()=>{ if(!id||locked)return; let active=true; void (async()=>{ const item=await getEntry(id,key); if(active){setEntry(item);setLoading(false)} })(); return()=>{active=false}},[id,key,locked])
  const tags=useMemo(()=>entry?.tags.join(', ')||'',[entry?.tags]); const skills=useMemo(()=>entry?.skills?.join(', ')||'',[entry?.skills])
  if(loading) return <main className="app-shell"><div className="card h-80 animate-pulse bg-slate-100 dark:bg-slate-800"/></main>
  if(!entry) return <main className="app-shell"><div className="card p-8 text-center"><h1 className="font-black">Catatan tidak ditemukan</h1><button className="btn-secondary mt-4" onClick={()=>router.push('/timeline/')}>Kembali</button></div></main>
  const set=<K extends keyof WorkEntry>(k:K,v:WorkEntry[K])=>setEntry(e=>e?{...e,[k]:v}:e)
  async function save(){ const next=await updateEntry(entry,key); setEntry(next); setMessage('Perubahan tersimpan.') }
  async function duplicate(){ const copy=await duplicateEntry(entry.id,key); router.push(`/entry/?id=${encodeURIComponent(copy.id)}`) }
  async function remove(){ if(!confirm('Hapus catatan ini permanen?'))return; await deleteEntry(entry.id); router.push('/timeline/') }
  async function archive(){ const next=await updateEntry({...entry,archived:!entry.archived},key); setEntry(next); setMessage(next.archived?'Catatan diarsipkan.':'Catatan dikembalikan.') }
  async function openHistory(){ const rows=await listHistory(entry.id,key); setHistory(rows); setShowHistory(v=>!v) }
  async function downloadAttachment(a:WorkEntry['attachments'][number]){ const blob=await getAttachmentBlob(a.id,key); const url=URL.createObjectURL(blob); const el=document.createElement('a'); el.href=url; el.download=a.name; el.click(); setTimeout(()=>URL.revokeObjectURL(url),1000) }
  return <main className="app-shell"><header className="pt-2"><p className="eyebrow">DETAIL ENTRY</p><h1 className="mt-1 text-3xl font-black">Edit bukti kerja</h1><p className="mt-1 text-sm text-slate-500">Versi lama disimpan setiap kali Anda menekan Simpan.</p></header>
    <section className="card mt-5 space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Tanggal</label><input type="date" className="field" value={entry.date} onChange={e=>set('date',e.target.value)}/></div><div><label className="label">Durasi</label><input type="number" className="field" value={entry.durationMin||''} onChange={e=>set('durationMin',e.target.value?Number(e.target.value):undefined)}/></div></div>
      <div><label className="label">Aktivitas</label><textarea className="field" rows={5} value={entry.activity} onChange={e=>set('activity',e.target.value)}/></div>
      <div className="grid grid-cols-5 gap-2">{moods.map(m=><button key={m.value} onClick={()=>set('mood',m.value)} className={`rounded-2xl border p-2 text-2xl ${entry.mood===m.value?'border-indigo-400 bg-indigo-50 dark:bg-indigo-950':'border-slate-200 dark:border-slate-700'}`}>{m.emoji}</button>)}</div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Proyek</label><input className="field" value={entry.project||''} onChange={e=>set('project',e.target.value)}/></div><div><label className="label">Klien / unit</label><input className="field" value={entry.client||''} onChange={e=>set('client',e.target.value)}/></div></div>
      <div><label className="label">Masalah</label><textarea className="field" rows={2} value={entry.problem||''} onChange={e=>set('problem',e.target.value)}/></div>
      <div><label className="label">Solusi</label><textarea className="field" rows={2} value={entry.solution||''} onChange={e=>set('solution',e.target.value)}/></div>
      <div><label className="label">Pelajaran</label><textarea className="field" rows={2} value={entry.lesson||''} onChange={e=>set('lesson',e.target.value)}/></div>
      <div><label className="label">Dampak / hasil</label><textarea className="field" rows={2} value={entry.impact||''} onChange={e=>set('impact',e.target.value)}/></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Tag</label><input className="field" value={tags} onChange={e=>set('tags',Array.from(new Set(e.target.value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean))))}/></div><div><label className="label">Skill</label><input className="field" value={skills} onChange={e=>set('skills',Array.from(new Set(e.target.value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean))))}/></div></div>
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-semibold dark:border-slate-700"><input type="checkbox" checked={Boolean(entry.isAchievement)} onChange={e=>set('isAchievement',e.target.checked)} className="h-5 w-5 accent-indigo-600"/><Star size={17} className="text-amber-500"/> Pencapaian penting</label>
      {entry.attachments.length>0&&<div><label className="label">Lampiran</label><div className="space-y-2">{entry.attachments.map(a=><button key={a.id} onClick={()=>void downloadAttachment(a)} className="btn-secondary w-full justify-between"><span className="truncate">{a.name}</span><Download size={16}/></button>)}</div></div>}
      <button onClick={()=>void save()} className="btn-primary w-full"><Save size={18}/>Simpan perubahan</button>{message&&<p className="text-center text-sm font-semibold text-emerald-600">{message}</p>}
    </section>
    <section className="mt-4 grid grid-cols-3 gap-2"><button onClick={()=>void duplicate()} className="btn-secondary !px-2 text-xs"><Copy size={16}/>Duplikat</button><button onClick={()=>void archive()} className="btn-secondary !px-2 text-xs"><Archive size={16}/>{entry.archived?'Pulihkan':'Arsip'}</button><button onClick={()=>void remove()} className="btn-danger !px-2 text-xs"><Trash2 size={16}/>Hapus</button></section>
    <section className="card mt-4 p-5"><button className="flex w-full items-center justify-between font-bold" onClick={()=>void openHistory()}><span className="flex items-center gap-2"><History size={18}/>Riwayat perubahan</span><span className="text-xs text-slate-400">{showHistory?'Tutup':'Buka'}</span></button>{showHistory&&<div className="mt-4 space-y-3">{history.length===0?<p className="text-sm text-slate-500">Belum ada versi sebelumnya.</p>:history.map((h,i)=><div key={`${h.updatedAt}-${i}`} className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><p className="text-xs font-bold text-slate-400">{new Date(h.updatedAt).toLocaleString('id-ID')}</p><p className="mt-1 line-clamp-3">{h.activity}</p></div>)}</div>}</section>
  </main>
}
