'use client'

import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Archive, ArrowLeft, Check, FileAudio, ImagePlus, ListChecks, Mic, Pin, Plus, RotateCcw, Save, Search, Trash2 } from 'lucide-react'
import { useSecurity } from '@/components/security/SecurityProvider'
import { useWorkAreas } from '@/hooks/useWorkAreas'
import { GENERAL_AREA_ID } from '@/lib/work-areas'
import { addNoteMedia, deleteNoteCheckHistory, deleteNoteMedia, deleteNotePermanently, emptyNote, getNoteMedia, listNoteHistory, listNotes, saveNote } from '@/lib/repository/notes'
import type { Note, NoteMedia } from '@/types'
import { DrawingPad } from './DrawingPad'
import { MindMapEditor } from './MindMapEditor'

const stamp = (value: string) => new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

function ChecklistText({ value, checked, onChange }: { value: string; checked: boolean; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = `${ref.current.scrollHeight}px`
  }, [value])
  return <textarea ref={ref} rows={1} className={`field min-w-0 flex-1 resize-none overflow-hidden !py-2 ${checked ? 'line-through opacity-60' : ''}`} style={{ overflowWrap: 'anywhere' }} aria-label="Teks item daftar" value={value} onChange={event => onChange(event.target.value)}/>
}

function MediaPreview({ media, keyValue, onRemove }: { media: NoteMedia; keyValue: CryptoKey | null; onRemove: () => void }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let active = true, objectUrl = ''
    void getNoteMedia(media.id, keyValue).then(blob => { objectUrl = URL.createObjectURL(blob); if (active) setUrl(objectUrl); else URL.revokeObjectURL(objectUrl) }).catch(() => undefined)
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [media.id, keyValue])
  return <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
    {/* Blob URLs are local user files and cannot use the static Next image optimizer. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {url && media.kind !== 'audio' && <img src={url} alt={media.name} className="max-h-64 w-full rounded-xl object-contain"/>}
    {url && media.kind === 'audio' && <audio controls src={url} className="w-full" aria-label={media.name}/>}
    {!url && <p className="text-xs text-slate-500">Membuka lampiran…</p>}
    <div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="truncate">{media.name}</span><button type="button" className="font-semibold text-rose-600" onClick={onRemove}>Lepas</button></div>
  </div>
}

export function NotesStudio() {
  const { key, ready, locked } = useSecurity()
  const areas = useWorkAreas()
  const notes = useLiveQuery(() => listNotes(key), [key], [])
  const [view, setView] = useState<'active' | 'archive' | 'trash'>('active')
  const [area, setArea] = useState('all')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<Note | null>(null)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [revisions, setRevisions] = useState<Awaited<ReturnType<typeof listNoteHistory>> | null>(null)
  const [recording, setRecording] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)

  function change(patch: Partial<Note>) { setDraft(current => current && { ...current, ...patch }); setDirty(true) }
  function leave() { if (recording) { setMessage('Selesaikan rekaman terlebih dahulu.'); return } if (dirty && !window.confirm('Perubahan belum disimpan. Keluar dari Note?')) return; setDraft(null); setDirty(false); setRevisions(null); setDrawing(false); setMessage('') }
  async function commit(note: Note) {
    setBusy(true); setMessage('')
    try { const saved = await saveNote(note, key); setDraft(saved); setDirty(false); setMessage('Note tersimpan.'); return saved }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal menyimpan.'); return null }
    finally { setBusy(false) }
  }
  async function action(patch: Partial<Note>) { if (!draft) return; await commit({ ...draft, ...patch }) }
  async function attach(blob: Blob, name: string, kind: NoteMedia['kind']) {
    if (!draft) return
    if (blob.size > 20 * 1024 * 1024) { setMessage('Setiap file maksimal 20 MB.'); return }
    setBusy(true)
    try {
      const first = await saveNote(draft, key)
      const meta = await addNoteMedia(first.id, blob, name, kind, key)
      try { const next = await saveNote({ ...first, media: [...first.media, meta] }, key); setDraft(next); setDirty(false); setMessage('Lampiran tersimpan.'); setDrawing(false) }
      catch (error) { await deleteNoteMedia(meta.id); throw error }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Lampiran gagal disimpan.') }
    finally { setBusy(false) }
  }
  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setMessage('Perekaman belum didukung browser ini.'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaStream.current = stream
      const rec = new MediaRecorder(stream); recorder.current = rec; const chunks: BlobPart[] = []
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
      rec.onstop = () => { stream.getTracks().forEach(track => track.stop()); mediaStream.current = null; setRecording(false); if (chunks.length) { const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); void attach(blob, `Rekaman-${new Date().toISOString().slice(0,16)}.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`, 'audio') } }
      rec.start(); setRecording(true); setMessage('Merekam… tekan Selesai untuk menyimpan.')
    } catch { setMessage('Izin mikrofon ditolak atau tidak tersedia.') }
  }
  function stopRecording() { if (recorder.current?.state === 'recording') recorder.current.stop() }
  async function toggle(itemId: string) {
    if (!draft || busy) return
    const item = draft.checklist.find(row => row.id === itemId); if (!item) return
    const at = new Date().toISOString(), checked = !item.checked
    await commit({ ...draft, checklist: draft.checklist.map(row => row.id === itemId ? { ...row, checked, checkedAt: checked ? at : undefined } : row), checkEvents: [...draft.checkEvents, { id: crypto.randomUUID(), itemId, text: item.text, checked, at }] })
  }
  async function removeCheckEvents(eventIds: string[] | 'all') {
    if (!draft || busy) return
    if (eventIds === 'all' && !window.confirm('Hapus semua riwayat centang pada Note ini? Status centang item tetap, tetapi riwayat yang dihapus tidak dapat dipulihkan dari versi Note.')) return
    setBusy(true); setMessage('')
    try {
      const saved = await deleteNoteCheckHistory(draft, eventIds, key)
      setDraft(saved); setDirty(false); setRevisions(null)
      setMessage(eventIds === 'all' ? 'Semua riwayat centang dihapus.' : 'Satu riwayat centang dihapus.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal menghapus riwayat centang.') }
    finally { setBusy(false) }
  }
  async function removeNote(permanent = false) {
    if (!draft) return
    if (!window.confirm(permanent ? 'Hapus permanen Note dan seluruh riwayat serta lampirannya?' : 'Pindahkan Note ke Sampah selama 30 hari?')) return
    if (permanent) { await deleteNotePermanently(draft.id); setDraft(null); setMessage('Note dihapus permanen.') }
    else { const saved = await commit({ ...draft, deletedAt: new Date().toISOString(), pinned: false }); if (saved) { setDraft(null); setView('trash') } }
    setDirty(false)
  }
  async function showHistory() { if (draft) setRevisions(await listNoteHistory(draft.id, key)) }
  const matches = (notes || []).filter(note => (view === 'trash' ? note.deletedAt : view === 'archive' ? note.archivedAt && !note.deletedAt : !note.archivedAt && !note.deletedAt) && (area === 'all' || (note.workAreaId || GENERAL_AREA_ID) === area) && `${note.title} ${note.text} ${note.checklist.map(i => i.text).join(' ')} ${note.mindNodes.map(i => i.text).join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  if (!ready || locked) return <main className="app-shell"><p>Memuat Note…</p></main>

  return <main className="app-shell space-y-4">
    {!draft ? <>
      <header className="flex items-start justify-between gap-3"><div><p className="eyebrow">Ruang catatan</p><h1 className="text-3xl font-black">Note</h1><p className="mt-1 text-sm text-slate-500">Catatan bebas untuk semua pekerjaan, terpisah dari log kerja.</p></div><button className="btn-primary shrink-0" onClick={() => { setDraft(emptyNote(area === 'all' ? GENERAL_AREA_ID : area)); setDirty(false); setMessage('') }}><Plus size={18}/>Baru</button></header>
      <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Status Note">{([['active','Aktif'],['archive','Arsip'],['trash','Sampah']] as const).map(([id,label]) => <button key={id} role="tab" aria-selected={view === id} className={`chip whitespace-nowrap ${view === id ? '!bg-indigo-600 !text-white' : ''}`} onClick={() => setView(id)}>{label}{id === 'trash' && ' · 30 hari'}</button>)}</div>
      <div className="grid gap-2 sm:grid-cols-[1fr_180px]"><label className="relative"><Search size={17} className="absolute left-3 top-4 text-slate-400"/><input className="field !pl-10" placeholder="Cari judul atau isi Note" value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label="Filter jenis pekerjaan" className="field" value={area} onChange={e => setArea(e.target.value)}><option value="all">Semua pekerjaan</option>{areas?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
      <p className="text-xs text-slate-500">{matches.length} Note · {view === 'trash' ? 'Dihapus otomatis 30 hari setelah masuk Sampah.' : 'Diurutkan: pin lalu terakhir diubah.'}</p>
      {matches.length ? <div className="grid gap-3 sm:grid-cols-2">{matches.map(note => <button key={note.id} type="button" className="card min-h-32 p-4 text-left transition hover:border-indigo-300" onClick={() => { setDraft(note); setDirty(false); setMessage('') }}><div className="flex items-center justify-between gap-2"><b className="truncate">{note.title || 'Tanpa judul'}</b>{note.pinned && <Pin size={16} className="shrink-0 text-indigo-600"/>}</div><p className="mt-2 line-clamp-2 text-sm text-slate-500">{note.text || note.checklist.map(i => i.text).join(' · ') || 'Peta pikiran atau lampiran'}</p><div className="mt-3 flex justify-between gap-2 text-xs text-slate-500"><span className="truncate">{areas?.find(a => a.id === (note.workAreaId || GENERAL_AREA_ID))?.name || 'Umum'}</span><span>{stamp(note.updatedAt)}</span></div></button>)}</div> : <div className="card p-8 text-center text-slate-500">Belum ada Note di sini.</div>}
    </> : <>
      <header className="flex items-center justify-between gap-2"><button type="button" className="btn-secondary !px-3" onClick={leave}><ArrowLeft size={17}/>Kembali</button><div className="flex gap-2"><button type="button" title="Pin" aria-label={draft.pinned ? 'Lepas pin' : 'Pin Note'} className="btn-secondary !px-3" onClick={() => void action({ pinned: !draft.pinned })}><Pin size={17} fill={draft.pinned ? 'currentColor' : 'none'}/></button><button type="button" className="btn-primary !px-3" disabled={busy} onClick={() => void commit(draft)}><Save size={17}/>Simpan</button></div></header>
      {message && <p role="status" className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">{message}</p>}
      <section className="card space-y-3 p-4"><input className="field text-xl font-bold" aria-label="Judul Note" placeholder="Judul Note" value={draft.title} onChange={e => change({ title: e.target.value })}/><select className="field" aria-label="Jenis pekerjaan Note" value={draft.workAreaId || GENERAL_AREA_ID} onChange={e => change({ workAreaId: e.target.value })}>{areas?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select><textarea className="field min-h-40 resize-y" aria-label="Isi Note" placeholder="Tulis catatan bebas di sini…" value={draft.text} onChange={e => change({ text: e.target.value })}/></section>
      <section className="card space-y-3 p-4">
        <h2 className="flex items-center gap-2 font-black"><ListChecks size={19}/>Daftar kegiatan</h2>
        {draft.checklist.map(item => <div key={item.id} className="flex min-w-0 items-start gap-2">
          <button type="button" className={`mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${item.checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'}`} aria-label={`${item.checked ? 'Batalkan' : 'Centang'} ${item.text}`} onClick={() => void toggle(item.id)}>{item.checked && <Check size={15}/>}</button>
          <ChecklistText value={item.text} checked={item.checked} onChange={text => change({ checklist: draft.checklist.map(row => row.id === item.id ? { ...row, text } : row) })}/>
          <button type="button" className="mt-2 shrink-0 text-rose-600" aria-label={`Hapus item ${item.text}`} onClick={() => change({ checklist: draft.checklist.filter(row => row.id !== item.id) })}><Trash2 size={17}/></button>
        </div>)}
        <button type="button" className="btn-secondary" onClick={() => change({ checklist: [...draft.checklist, { id: crypto.randomUUID(), text: '', checked: false, createdAt: new Date().toISOString() }] })}><Plus size={16}/>Tambah item</button>
        <details className="text-sm"><summary className="cursor-pointer font-semibold">Riwayat centang ({draft.checkEvents.length})</summary>
          {draft.checkEvents.length > 0 && <div className="mt-2 flex justify-end"><button type="button" className="text-xs font-semibold text-rose-600 disabled:opacity-50" disabled={busy} onClick={() => void removeCheckEvents('all')}>Hapus semua riwayat centang</button></div>}
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">{[...draft.checkEvents].reverse().map(event => <div key={event.id} className="flex min-w-0 items-start justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800"><p className="min-w-0 whitespace-pre-wrap break-words text-slate-500" style={{ overflowWrap: 'anywhere' }}>{stamp(event.at)} · {event.checked ? '✓ Selesai' : '↶ Batal'} · {event.text || '(tanpa teks)'}</p><button type="button" className="shrink-0 text-rose-600 disabled:opacity-50" disabled={busy} aria-label={`Hapus riwayat ${event.text} pada ${stamp(event.at)}`} title="Hapus riwayat ini" onClick={() => void removeCheckEvents([event.id])}><Trash2 size={16}/></button></div>)}</div>
        </details>
      </section>
      <section className="card p-4"><h2 className="mb-3 font-black">Peta pikiran</h2><MindMapEditor nodes={draft.mindNodes} onChange={mindNodes => change({ mindNodes })}/></section>
      <section className="card space-y-3 p-4"><h2 className="font-black">Gambar, kanvas & suara</h2><div className="flex flex-wrap gap-2"><label className="btn-secondary cursor-pointer"><ImagePlus size={17}/>Tambah gambar<input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void attach(file, file.name, 'image'); e.target.value = '' }}/></label><button type="button" className="btn-secondary" onClick={() => setDrawing(!drawing)}><ImagePlus size={17}/>Kanvas</button><button type="button" className="btn-secondary" onClick={() => recording ? stopRecording() : void startRecording()}>{recording ? <FileAudio size={17}/> : <Mic size={17}/>} {recording ? 'Selesai rekam' : 'Rekam audio'}</button></div>{drawing && <DrawingPad onSave={blob => attach(blob, `Kanvas-${Date.now()}.png`, 'drawing')}/>}<div className="grid gap-2 sm:grid-cols-2">{draft.media.map(media => <MediaPreview key={media.id} media={media} keyValue={key} onRemove={() => change({ media: draft.media.filter(row => row.id !== media.id) })}/>)}</div><p className="text-xs text-slate-500">Maksimal 20 MB per file. Rekaman membutuhkan izin mikrofon dan HTTPS.</p></section>
      <section className="card space-y-3 p-4"><h2 className="font-black">Riwayat & pengelolaan</h2><p className="text-xs text-slate-500">Dibuat {stamp(draft.createdAt)} · Diubah {stamp(draft.updatedAt)}{draft.deletedAt ? ` · Dihapus ${stamp(draft.deletedAt)}` : ''}</p><div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={() => void showHistory()}><RotateCcw size={17}/>Riwayat versi</button>{draft.deletedAt ? <><button type="button" className="btn-secondary" onClick={() => void action({ deletedAt: undefined })}>Pulihkan dari Sampah</button><button type="button" className="btn-danger" onClick={() => void removeNote(true)}>Hapus permanen</button></> : <><button type="button" className="btn-secondary" onClick={() => void action({ archivedAt: draft.archivedAt ? undefined : new Date().toISOString() })}><Archive size={17}/>{draft.archivedAt ? 'Keluarkan dari Arsip' : 'Arsipkan'}</button><button type="button" className="btn-danger" onClick={() => void removeNote()}><Trash2 size={17}/>Ke Sampah</button></>}</div>{revisions && <div className="max-h-72 space-y-2 overflow-y-auto border-t pt-3 dark:border-slate-700"><h3 className="font-semibold">Versi sebelumnya ({revisions.length})</h3>{revisions.map((revision, index) => <div key={`${revision.at}-${index}`} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2 text-sm dark:bg-slate-800"><span className="truncate">{stamp(revision.at)} · {revision.note.title || 'Tanpa judul'}</span><button type="button" className="font-bold text-indigo-600" onClick={() => { if (window.confirm('Pulihkan isi versi ini? Versi saat ini tetap tersimpan dalam riwayat.')) void commit({ ...revision.note, id: draft.id, createdAt: draft.createdAt, deletedAt: draft.deletedAt }) }}>Pulihkan</button></div>)}{!revisions.length && <p className="text-sm text-slate-500">Belum ada versi sebelumnya.</p>}</div>}</section>
    </>}
  </main>
}
