'use client'

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronUp, Mic, MicOff, Paperclip, Save, Sparkles, X } from 'lucide-react'
import { db } from '@/lib/db/db'
import { consumeLatestPendingShare } from '@/lib/pwa/share'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { localDateKey } from '@/lib/date'
import { clearDraft, createEntry, loadDraft, saveDraft } from '@/lib/repository/entries'
import { useSecurity } from '@/components/security/SecurityProvider'
import type { EntryDraft, Mood } from '@/types'

const MAX_FILE_BYTES = 15 * 1024 * 1024
const MAX_TOTAL_FILE_BYTES = 30 * 1024 * 1024

const moods: Array<{ value: Mood; emoji: string; label: string }> = [
  { value: 1, emoji: '😣', label: 'Berat' }, { value: 2, emoji: '😕', label: 'Kurang' },
  { value: 3, emoji: '😐', label: 'Biasa' }, { value: 4, emoji: '🙂', label: 'Baik' }, { value: 5, emoji: '🚀', label: 'Mantap' }
]

function freshDraft(): EntryDraft {
  return {
    id: 'quick-capture', date: localDateKey(), activity: '', problem: '', project: '', client: '', solution: '', lesson: '', impact: '',
    mood: 3, durationMin: undefined, tags: [], skills: [], attachments: [], pendingFiles: [], isAchievement: false, updatedAt: new Date().toISOString()
  }
}

export function QuickCaptureForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { key, locked, settings } = useSecurity()
  const templates = useLiveQuery(() => db.templates.toArray(), [], [])
  const [draft, setDraft] = useState<EntryDraft>(freshDraft)
  const [advanced, setAdvanced] = useState(false)
  const [tagText, setTagText] = useState('')
  const [skillText, setSkillText] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  const update = useCallback(<K extends keyof EntryDraft>(field: K, value: EntryDraft[K]) => setDraft((current) => ({ ...current, [field]: value })), [])
  const appendVoice = useCallback((text: string) => setDraft((current) => ({ ...current, activity: current.activity ? `${current.activity} ${text}` : text })), [])
  const voice = useVoiceInput(appendVoice)

  useEffect(() => {
    if (locked) return
    let active = true
    void (async () => {
      const stored = await loadDraft(key)
      if (!active) return
      if (stored) {
        setDraft({ ...stored, pendingFiles: [] })
        setTagText(stored.tags.join(', ')); setSkillText((stored.skills || []).join(', '))
      } else if (settings?.defaultTemplateId) setDraft((d) => ({ ...d, templateId: settings.defaultTemplateId }))
      if (searchParams.get('shared') === '1') {
        const shared = await consumeLatestPendingShare()
        if (shared && active) {
          const combined = [shared.title, shared.text, shared.url].filter(Boolean).join('\n')
          setDraft((current) => ({ ...current, activity: [current.activity, combined].filter(Boolean).join('\n'), pendingFiles: [...(current.pendingFiles || []), ...shared.files] }))
        }
      }
      setLoaded(true)
    })()
    return () => { active = false }
  }, [key, locked, searchParams, settings?.defaultTemplateId])

  useEffect(() => {
    if (!loaded || locked) return
    const timer = window.setInterval(() => {
      if (!draft.activity.trim() && !draft.problem?.trim() && !(draft.pendingFiles?.length)) return
      setStatus('saving')
      const next = { ...draft, updatedAt: new Date().toISOString() }
      void saveDraft(next, key).then(() => { setStatus('saved'); window.setTimeout(() => setStatus('idle'), 1300) })
    }, 5000)
    return () => window.clearInterval(timer)
  }, [draft, key, loaded, locked])

  const canSave = draft.activity.trim().length > 0 && !submitting && !locked
  const charHint = useMemo(() => draft.activity.trim().length, [draft.activity])

  function applyTemplate(templateId: string) {
    update('templateId', templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template?.starterText && !draft.activity.trim()) update('activity', template.starterText)
    if (template && template.fields.some((f) => f !== 'activity')) setAdvanced(true)
  }

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files || [])
    const tooLarge = incoming.find((file) => file.size > MAX_FILE_BYTES)
    if (tooLarge) {
      setError(`File ${tooLarge.name} lebih dari 15 MB. Kompres atau pilih file yang lebih kecil.`)
      event.target.value = ''
      return
    }
    const current = draft.pendingFiles || []
    const total = [...current, ...incoming].reduce((sum, file) => sum + file.size, 0)
    if (total > MAX_TOTAL_FILE_BYTES) {
      setError('Total lampiran satu entry maksimal 30 MB agar penyimpanan PWA tetap sehat.')
      event.target.value = ''
      return
    }
    setError('')
    if (incoming.length) update('pendingFiles', [...current, ...incoming])
    event.target.value = ''
  }

  function parseList(text: string) { return Array.from(new Set(text.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean))) }

  async function save() {
    if (!canSave) return
    setSubmitting(true); setError('')
    try {
      await createEntry({
        date: draft.date, project: draft.project?.trim() || undefined, client: draft.client?.trim() || undefined,
        activity: draft.activity.trim(), problem: draft.problem?.trim() || undefined, solution: draft.solution?.trim() || undefined,
        lesson: draft.lesson?.trim() || undefined, mood: draft.mood, durationMin: draft.durationMin || undefined,
        tags: parseList(tagText), skills: parseList(skillText), impact: draft.impact?.trim() || undefined,
        isAchievement: Boolean(draft.isAchievement), archived: false, syncedAt: null, files: draft.pendingFiles || []
      }, key)
      await clearDraft()
      router.push('/timeline/?created=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan catatan.')
      setSubmitting(false)
    }
  }

  async function clearAll() {
    setDraft(freshDraft()); setTagText(''); setSkillText(''); await clearDraft()
  }

  return (
    <main className="app-shell">
      <header className="mb-5 flex items-end justify-between gap-3 pt-2">
        <div><p className="eyebrow">QUICK CAPTURE</p><h1 className="mt-1 text-2xl font-black">Apa yang Anda kerjakan?</h1></div>
        <span className="text-xs font-semibold text-slate-400">{status === 'saving' ? 'Menyimpan…' : status === 'saved' ? 'Draft tersimpan ✓' : 'Autosave 5 dtk'}</span>
      </header>

      <section className="card p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-[1fr_auto] gap-3">
          <select className="field" value={draft.templateId || ''} onChange={(e) => applyTemplate(e.target.value)} aria-label="Template">
            <option value="">Tanpa template</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button type="button" className="btn-secondary !px-3" onClick={() => router.push('/templates/')} title="Kelola template"><Sparkles size={18}/></button>
        </div>

        <label htmlFor="activity" className="label">Aktivitas utama *</label>
        <div className="relative">
          <textarea id="activity" value={draft.activity} onChange={(e) => update('activity', e.target.value)} rows={5} className="field resize-none !pr-14" placeholder="Contoh: Menyelesaikan rekonsiliasi laporan bulan September…" autoFocus />
          {voice.supported && <button type="button" onClick={voice.toggle} className={`absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-xl ${voice.listening ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`} aria-label="Input suara">{voice.listening ? <MicOff size={19}/> : <Mic size={19}/>}</button>}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400"><span>{voice.listening ? 'Mendengarkan…' : 'Aktivitas saja sudah cukup untuk simpan cepat.'}</span><span>{charHint} karakter</span></div>

        <label className="label mt-5">Mood</label>
        <div className="grid grid-cols-5 gap-2">
          {moods.map((mood) => <button key={mood.value} type="button" onClick={() => update('mood', mood.value)} className={`rounded-2xl border p-2 transition ${draft.mood === mood.value ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100 dark:bg-indigo-950' : 'border-slate-200 dark:border-slate-700'}`}><span className="block text-2xl">{mood.emoji}</span><span className="mt-1 block text-[10px] font-semibold text-slate-500">{mood.label}</span></button>)}
        </div>

        <button type="button" onClick={() => setAdvanced((v) => !v)} className="mt-5 flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Detail lanjutan {advanced ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</button>

        {advanced && <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Tanggal</label><input type="date" value={draft.date} onChange={(e) => update('date', e.target.value)} className="field" /></div><div><label className="label">Durasi (menit)</label><input type="number" min="1" value={draft.durationMin ?? ''} onChange={(e) => update('durationMin', e.target.value ? Number(e.target.value) : undefined)} className="field" placeholder="60" /></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Proyek</label><input value={draft.project || ''} onChange={(e) => update('project', e.target.value)} className="field" placeholder="Nama proyek" /></div><div><label className="label">Klien / unit</label><input value={draft.client || ''} onChange={(e) => update('client', e.target.value)} className="field" placeholder="Opsional" /></div></div>
          <div><label className="label">Masalah</label><textarea value={draft.problem || ''} onChange={(e) => update('problem', e.target.value)} rows={2} className="field resize-none" placeholder="Hambatan atau risiko…" /></div>
          <div><label className="label">Solusi / tindakan</label><textarea value={draft.solution || ''} onChange={(e) => update('solution', e.target.value)} rows={2} className="field resize-none" placeholder="Apa yang Anda lakukan?" /></div>
          <div><label className="label">Pelajaran</label><textarea value={draft.lesson || ''} onChange={(e) => update('lesson', e.target.value)} rows={2} className="field resize-none" placeholder="Apa yang akan dilakukan lebih baik berikutnya?" /></div>
          <div><label className="label">Dampak / hasil</label><textarea value={draft.impact || ''} onChange={(e) => update('impact', e.target.value)} rows={2} className="field resize-none" placeholder="Contoh: proses lebih cepat 30%, error berkurang…" /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Tag</label><input value={tagText} onChange={(e) => setTagText(e.target.value)} className="field" placeholder="laporan, meeting" /></div><div><label className="label">Skill</label><input value={skillText} onChange={(e) => setSkillText(e.target.value)} className="field" placeholder="excel, negosiasi" /></div></div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-semibold dark:border-slate-700"><input type="checkbox" checked={Boolean(draft.isAchievement)} onChange={(e) => update('isAchievement', e.target.checked)} className="h-5 w-5 accent-indigo-600"/> Tandai sebagai pencapaian penting</label>
          <div><label className="label">Lampiran</label><label className="btn-secondary w-full cursor-pointer"><Paperclip size={18}/> Tambah foto / file<input type="file" multiple className="hidden" onChange={addFiles}/></label>
            {(draft.pendingFiles || []).length > 0 && <div className="mt-2 space-y-2">{(draft.pendingFiles || []).map((file, i) => <div key={`${file.name}-${i}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800"><span className="truncate">{file.name}</span><button type="button" onClick={() => update('pendingFiles', (draft.pendingFiles || []).filter((_, idx) => idx !== i))}><X size={15}/></button></div>)}</div>}
          </div>
        </div>}

        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
        <div className="mt-5 grid grid-cols-[auto_1fr] gap-3"><button type="button" onClick={() => void clearAll()} className="btn-secondary !px-4"><X size={18}/></button><button type="button" onClick={() => void save()} disabled={!canSave} className="btn-primary"><Save size={18}/>{submitting ? 'Menyimpan…' : 'Simpan Catatan'}</button></div>
      </section>
    </main>
  )
}
