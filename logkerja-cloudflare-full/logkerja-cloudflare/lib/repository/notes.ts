import { db } from '@/lib/db/db'
import { decryptBlob, decryptJson, encryptBlob, encryptJson } from '@/lib/crypto/records'
import { GENERAL_AREA_ID } from '@/lib/work-areas'
import type { Note, NoteMedia, NoteMediaRecord, NoteVersion, SecureNoteRecord } from '@/types'

const DAY = 86_400_000
async function vaultEnabled() { return Boolean((await db.settings.get('app'))?.security?.enabled) }

export function emptyNote(workAreaId = GENERAL_AREA_ID): Note {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), workAreaId, title: '', text: '', checklist: [], checkEvents: [], mindNodes: [], media: [], pinned: false, createdAt: now, updatedAt: now }
}

export async function listNotes(key: CryptoKey | null): Promise<Note[]> {
  const plain = await db.notes.toArray()
  const secure = await db.secureNotes.toArray()
  const decrypted: Note[] = []
  if (key) for (const row of secure) {
    try { decrypted.push(await decryptJson<Note>(row.cipher, row.iv, key)) } catch { /* Locked or damaged record. */ }
  }
  return [...plain, ...decrypted].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
}

export async function getNote(id: string, key: CryptoKey | null): Promise<Note | null> {
  const plain = await db.notes.get(id)
  if (plain) return plain
  const secure = await db.secureNotes.get(id)
  return secure && key ? decryptJson<Note>(secure.cipher, secure.iv, key) : null
}

export async function saveNote(note: Note, key: CryptoKey | null): Promise<Note> {
  const previous = await getNote(note.id, key)
  const next = { ...note, updatedAt: new Date().toISOString() }
  const encrypted = Boolean(await db.secureNotes.get(note.id)) || await vaultEnabled()
  if (encrypted && !key) throw new Error('Buka vault terlebih dahulu.')
  const version: NoteVersion | null = previous ? { id: crypto.randomUUID(), noteId: note.id, createdAt: next.updatedAt, encrypted } : null
  // Encrypt before entering the transaction; WebCrypto can close an IndexedDB transaction.
  const secured = encrypted ? await encryptJson(next, key!) : null
  const securedVersion = version && encrypted ? await encryptJson(previous!, key!) : null
  await db.transaction('rw', db.notes, db.secureNotes, db.noteHistory, async () => {
    if (version) await db.noteHistory.put(encrypted ? { ...version, ...securedVersion } : { ...version, payload: previous! })
    if (secured) {
      await db.secureNotes.put({ id: note.id, ...secured, updatedAt: next.updatedAt, deletedAt: next.deletedAt })
      await db.notes.delete(note.id)
    } else await db.notes.put(next)
  })
  return next
}

export async function listNoteHistory(noteId: string, key: CryptoKey | null): Promise<Array<{ at: string; note: Note }>> {
  const rows = await db.noteHistory.where('noteId').equals(noteId).reverse().sortBy('createdAt')
  const result: Array<{ at: string; note: Note }> = []
  for (const row of rows) {
    if (row.payload) result.push({ at: row.createdAt, note: row.payload })
    else if (key && row.cipher && row.iv) {
      try { result.push({ at: row.createdAt, note: await decryptJson<Note>(row.cipher, row.iv, key) }) } catch { /* Skip unreadable revision. */ }
    }
  }
  return result
}

export async function deleteNoteCheckHistory(note: Note, eventIds: string[] | 'all', key: CryptoKey | null): Promise<Note> {
  const ids = new Set(eventIds === 'all' ? [] : eventIds)
  const keep = (id: string) => eventIds !== 'all' && !ids.has(id)
  const scrub = (value: Note): Note => ({ ...value, checkEvents: value.checkEvents.filter(event => keep(event.id)) })
  const previous = await getNote(note.id, key)
  if (!previous) throw new Error('Simpan Note terlebih dahulu.')
  const encrypted = Boolean(await db.secureNotes.get(note.id)) || await vaultEnabled()
  if (encrypted && !key) throw new Error('Buka vault terlebih dahulu.')

  const next = { ...scrub(note), updatedAt: new Date().toISOString() }
  const versions = await db.noteHistory.where('noteId').equals(note.id).toArray()
  const cleanedVersions: NoteVersion[] = []
  for (const version of versions) {
    const payload = version.encrypted
      ? await decryptJson<Note>(version.cipher!, version.iv!, key!)
      : version.payload
    if (!payload) throw new Error('Riwayat Note tidak dapat dibaca.')
    const cleaned = scrub(payload)
    cleanedVersions.push(version.encrypted
      ? { ...version, ...await encryptJson(cleaned, key!) }
      : { ...version, payload: cleaned })
  }

  // Keep the previous note as a version, but remove the deleted events from it too.
  const snapshot: NoteVersion = {
    id: crypto.randomUUID(), noteId: note.id, createdAt: next.updatedAt, encrypted,
    ...(encrypted ? await encryptJson(scrub(previous), key!) : { payload: scrub(previous) })
  }
  const secured = encrypted ? await encryptJson(next, key!) : null
  await db.transaction('rw', db.notes, db.secureNotes, db.noteHistory, async () => {
    if (cleanedVersions.length) await db.noteHistory.bulkPut(cleanedVersions)
    await db.noteHistory.put(snapshot)
    if (secured) {
      await db.secureNotes.put({ id: next.id, ...secured, updatedAt: next.updatedAt, deletedAt: next.deletedAt })
      await db.notes.delete(next.id)
    } else await db.notes.put(next)
  })
  return next
}

export async function addNoteMedia(noteId: string, blob: Blob, name: string, kind: NoteMedia['kind'], key: CryptoKey | null): Promise<NoteMedia> {
  if (blob.size > 20 * 1024 * 1024) throw new Error('Setiap file maksimal 20 MB.')
  if (kind === 'image' && !blob.type.startsWith('image/') || kind === 'audio' && !blob.type.startsWith('audio/')) throw new Error('Jenis file tidak sesuai.')
  const encrypted = await vaultEnabled()
  if (encrypted && !key) throw new Error('Buka vault terlebih dahulu.')
  const meta: NoteMedia = { id: crypto.randomUUID(), name, type: blob.type || 'application/octet-stream', size: blob.size, kind, createdAt: new Date().toISOString() }
  const secured = encrypted ? await encryptBlob(blob, key!) : null
  await db.noteMedia.put({ ...meta, noteId, encrypted, ...(secured || { blob }) })
  return meta
}

export async function getNoteMedia(id: string, key: CryptoKey | null): Promise<Blob> {
  const row = await db.noteMedia.get(id)
  if (!row) throw new Error('Lampiran tidak tersedia.')
  if (!row.encrypted && row.blob) return row.blob
  if (!row.cipher || !row.iv || !key) throw new Error('Buka vault terlebih dahulu.')
  return decryptBlob(row.cipher, row.iv, row.type, key)
}

export async function deleteNoteMedia(id: string) { await db.noteMedia.delete(id) }

export async function deleteNotePermanently(id: string) {
  await db.transaction('rw', db.notes, db.secureNotes, db.noteMedia, db.noteHistory, async () => {
    await db.notes.delete(id)
    await db.secureNotes.delete(id)
    await db.noteMedia.where('noteId').equals(id).delete()
    await db.noteHistory.where('noteId').equals(id).delete()
  })
}

export async function purgeExpiredNotes(now = Date.now()): Promise<number> {
  const threshold = now - 30 * DAY
  const plain = await db.notes.where('deletedAt').above('').toArray()
  const secure = await db.secureNotes.where('deletedAt').above('').toArray()
  const ids = [...plain, ...secure].filter(row => row.deletedAt && Date.parse(row.deletedAt) <= threshold).map(row => row.id)
  for (const id of new Set(ids)) await deleteNotePermanently(id)
  return ids.length
}

export async function prepareNoteVaultMigration(key: CryptoKey) {
  const plain = await db.notes.toArray()
  const media = (await db.noteMedia.toArray()).filter(row => !row.encrypted && row.blob)
  const history = (await db.noteHistory.toArray()).filter(row => !row.encrypted && row.payload)
  const secureNotes: SecureNoteRecord[] = []
  const secureMedia: NoteMediaRecord[] = []
  const secureHistory: NoteVersion[] = []
  for (const note of plain) secureNotes.push({ id: note.id, ...await encryptJson(note, key), updatedAt: note.updatedAt, deletedAt: note.deletedAt })
  for (const row of media) secureMedia.push({ ...row, ...await encryptBlob(row.blob!, key), blob: undefined, encrypted: true })
  for (const row of history) secureHistory.push({ ...row, ...await encryptJson(row.payload!, key), payload: undefined, encrypted: true })
  return { secureNotes, secureMedia, secureHistory }
}
