import { db } from '@/lib/db/db'
import { decryptBlob, decryptJson, encryptBlob, encryptJson } from '@/lib/crypto/records'
import type { AttachmentRecord, EntryDraft, EntryVersion, LegacyWorkEntry, SecureEntryRecord, WorkEntry } from '@/types'

async function isSecurityEnabled() {
  const settings = await db.settings.get('app')
  return Boolean(settings?.security?.enabled)
}

function stripLegacyBlobs(entry: LegacyWorkEntry): WorkEntry {
  return { ...entry, attachments: (entry.attachments || []).map(({ blob: _blob, ...meta }) => meta) }
}

export async function listEntries(key: CryptoKey | null): Promise<WorkEntry[]> {
  const plain = (await db.entries.toArray()).map(stripLegacyBlobs)
  const secure = await db.secureEntries.toArray()
  const decrypted: WorkEntry[] = []
  if (secure.length && key) {
    for (const record of secure) {
      try { decrypted.push(await decryptJson<WorkEntry>(record.cipher, record.iv, key)) } catch { /* locked/corrupt record */ }
    }
  }
  return [...plain, ...decrypted].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export async function getEntry(id: string, key: CryptoKey | null): Promise<WorkEntry | null> {
  const plain = await db.entries.get(id)
  if (plain) return stripLegacyBlobs(plain)
  const secure = await db.secureEntries.get(id)
  if (!secure || !key) return null
  return decryptJson<WorkEntry>(secure.cipher, secure.iv, key)
}

async function saveAttachment(entryId: string, file: File, key: CryptoKey | null) {
  const encrypted = await isSecurityEnabled()
  const base: AttachmentRecord = {
    id: crypto.randomUUID(), entryId, name: file.name, type: file.type || 'application/octet-stream',
    size: file.size, createdAt: new Date().toISOString(), encrypted
  }
  if (encrypted) {
    if (!key) throw new Error('Vault terkunci.')
    const secured = await encryptBlob(file, key)
    await db.attachments.put({ ...base, cipher: secured.cipher, iv: secured.iv })
  } else {
    await db.attachments.put({ ...base, blob: file })
  }
  return { id: base.id, name: base.name, type: base.type, size: base.size, createdAt: base.createdAt }
}

export async function createEntry(input: Omit<WorkEntry, 'id' | 'createdAt' | 'updatedAt' | 'attachments'> & { files?: File[] }, key: CryptoKey | null) {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const attachments = []
  try {
    for (const file of input.files || []) attachments.push(await saveAttachment(id, file, key))
    const entry: WorkEntry = {
      id, date: input.date, project: input.project, client: input.client, activity: input.activity,
      problem: input.problem, solution: input.solution, lesson: input.lesson, mood: input.mood,
      durationMin: input.durationMin, tags: input.tags, skills: input.skills, impact: input.impact,
      isAchievement: input.isAchievement, archived: input.archived, syncedAt: input.syncedAt,
      attachments, createdAt: now, updatedAt: now
    }
    if (await isSecurityEnabled()) {
      if (!key) throw new Error('Vault terkunci.')
      const encrypted = await encryptJson(entry, key)
      await db.secureEntries.put({ id, cipher: encrypted.cipher, iv: encrypted.iv, updatedAt: now })
    } else {
      await db.entries.put(entry as LegacyWorkEntry)
    }
    return entry
  } catch (error) {
    // Avoid orphaned attachment rows if entry persistence fails after files were saved.
    await db.attachments.where('entryId').equals(id).delete().catch(() => undefined)
    throw error
  }
}

export async function updateEntry(entry: WorkEntry, key: CryptoKey | null) {
  const previous = await getEntry(entry.id, key)
  if (previous) await saveHistory(previous, key)
  const next = { ...entry, updatedAt: new Date().toISOString() }
  const secure = await db.secureEntries.get(entry.id)
  if (secure || await isSecurityEnabled()) {
    if (!key) throw new Error('Vault terkunci.')
    const encrypted = await encryptJson(next, key)
    await db.secureEntries.put({ id: next.id, cipher: encrypted.cipher, iv: encrypted.iv, updatedAt: next.updatedAt })
    await db.entries.delete(next.id)
  } else {
    await db.entries.put(next as LegacyWorkEntry)
  }
  return next
}

export async function deleteEntry(id: string) {
  await db.transaction('rw', db.entries, db.secureEntries, db.attachments, db.entryHistory, async () => {
    await db.entries.delete(id)
    await db.secureEntries.delete(id)
    await db.attachments.where('entryId').equals(id).delete()
    await db.entryHistory.where('entryId').equals(id).delete()
  })
}

export async function duplicateEntry(id: string, key: CryptoKey | null) {
  const source = await getEntry(id, key)
  if (!source) throw new Error('Catatan tidak ditemukan.')
  const { id: _id, attachments: _attachments, createdAt: _created, updatedAt: _updated, ...copy } = source
  return createEntry({ ...copy, activity: `${copy.activity} (salinan)`, files: [] }, key)
}

async function saveHistory(entry: WorkEntry, key: CryptoKey | null) {
  const encrypted = await isSecurityEnabled()
  const base: EntryVersion = { id: crypto.randomUUID(), entryId: entry.id, createdAt: new Date().toISOString(), encrypted }
  if (encrypted) {
    if (!key) return
    const secured = await encryptJson(entry, key)
    await db.entryHistory.put({ ...base, cipher: secured.cipher, iv: secured.iv })
  } else await db.entryHistory.put({ ...base, payload: entry })
}

export async function listHistory(entryId: string, key: CryptoKey | null): Promise<WorkEntry[]> {
  const rows = await db.entryHistory.where('entryId').equals(entryId).reverse().sortBy('createdAt')
  const out: WorkEntry[] = []
  for (const row of rows) {
    if (!row.encrypted && row.payload) out.push(row.payload)
    else if (row.cipher && row.iv && key) {
      try { out.push(await decryptJson<WorkEntry>(row.cipher, row.iv, key)) } catch { /* ignore */ }
    }
  }
  return out
}

export async function getAttachmentBlob(id: string, key: CryptoKey | null) {
  const record = await db.attachments.get(id)
  if (!record) throw new Error('Lampiran tidak ditemukan.')
  if (!record.encrypted && record.blob) return record.blob
  if (!record.cipher || !record.iv || !key) throw new Error('Vault terkunci.')
  return decryptBlob(record.cipher, record.iv, record.type, key)
}

export async function saveDraft(draft: EntryDraft, key: CryptoKey | null) {
  if (await isSecurityEnabled()) {
    if (!key) return
    const serializable = { ...draft, pendingFiles: [] }
    const encrypted = await encryptJson(serializable, key)
    await db.secureDrafts.put({ id: 'quick-capture', cipher: encrypted.cipher, iv: encrypted.iv, updatedAt: draft.updatedAt })
    await db.drafts.delete('quick-capture')
  } else await db.drafts.put({ ...draft, pendingFiles: [] })
}

export async function loadDraft(key: CryptoKey | null): Promise<EntryDraft | null> {
  const secure = await db.secureDrafts.get('quick-capture')
  if (secure) {
    if (!key) return null
    return decryptJson<EntryDraft>(secure.cipher, secure.iv, key)
  }
  return (await db.drafts.get('quick-capture')) || null
}

export async function clearDraft() {
  await Promise.all([db.drafts.delete('quick-capture'), db.secureDrafts.delete('quick-capture')])
}

export async function migratePlaintextToVault(key: CryptoKey) {
  // WebCrypto work is intentionally completed before opening the IndexedDB
  // transaction. Browser transactions can auto-close while awaiting unrelated
  // async work, so the transaction below only performs database operations.
  const entries = await db.entries.toArray()
  const attachmentRows = await db.attachments.toArray()
  const history = (await db.entryHistory.toArray()).filter((item) => !item.encrypted && item.payload)
  const draft = await db.drafts.get('quick-capture')

  const secureEntries: SecureEntryRecord[] = []
  for (const legacy of entries) {
    const entry = stripLegacyBlobs(legacy)
    const secured = await encryptJson(entry, key)
    secureEntries.push({ id: entry.id, cipher: secured.cipher, iv: secured.iv, updatedAt: entry.updatedAt })
  }

  // Collect both legacy inline blobs and v2 attachment-table blobs, de-duplicated by id.
  const blobSources = new Map<string, { record: AttachmentRecord; blob: Blob }>()
  for (const legacy of entries) {
    for (const inline of legacy.attachments || []) {
      if (!inline.blob) continue
      blobSources.set(inline.id, {
        record: { id: inline.id, entryId: legacy.id, name: inline.name, type: inline.type, size: inline.size, createdAt: inline.createdAt, encrypted: false },
        blob: inline.blob
      })
    }
  }
  for (const record of attachmentRows) {
    if (!record.encrypted && record.blob) blobSources.set(record.id, { record, blob: record.blob })
  }
  const secureAttachments: AttachmentRecord[] = []
  for (const { record, blob } of blobSources.values()) {
    const secured = await encryptBlob(blob, key)
    secureAttachments.push({ ...record, encrypted: true, blob: undefined, cipher: secured.cipher, iv: secured.iv })
  }

  const secureHistory: EntryVersion[] = []
  for (const version of history) {
    if (!version.payload) continue
    const secured = await encryptJson(version.payload, key)
    secureHistory.push({ ...version, encrypted: true, payload: undefined, cipher: secured.cipher, iv: secured.iv })
  }

  let secureDraft: { id: 'quick-capture'; cipher: ArrayBuffer; iv: string; updatedAt: string } | null = null
  if (draft) {
    const secured = await encryptJson({ ...draft, pendingFiles: [] }, key)
    secureDraft = { id: 'quick-capture', cipher: secured.cipher, iv: secured.iv, updatedAt: draft.updatedAt }
  }

  await db.transaction('rw', [db.entries, db.secureEntries, db.attachments, db.entryHistory, db.drafts, db.secureDrafts], async () => {
    if (secureEntries.length) await db.secureEntries.bulkPut(secureEntries)
    if (secureAttachments.length) await db.attachments.bulkPut(secureAttachments)
    if (secureHistory.length) await db.entryHistory.bulkPut(secureHistory)
    if (secureDraft) await db.secureDrafts.put(secureDraft)
    await db.entries.clear()
    await db.drafts.delete('quick-capture')
  })
}
