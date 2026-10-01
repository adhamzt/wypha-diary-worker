import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import Dexie from 'dexie'

test('note, checklist, media, riwayat, sampah, vault, dan backup tetap utuh', async () => {
  const old = new Dexie('workdiary')
  old.version(3).stores({ entries: 'id, date, project, client, mood, createdAt, updatedAt, *tags', settings: 'id', workAreas: 'id, name, archived, createdAt' })
  await old.table('entries').put({ id: 'old', date: '2026-09-01', activity: 'Log lama', mood: 3, tags: [], attachments: [], createdAt: '2026-09-01', updatedAt: '2026-09-01' })
  old.close()

  const { db } = await import('@/lib/db/db')
  const { ensureBootstrap } = await import('@/lib/db/bootstrap')
  const { emptyNote, saveNote, listNotes, listNoteHistory, addNoteMedia, getNoteMedia, purgeExpiredNotes } = await import('@/lib/repository/notes')
  const { migratePlaintextToVault } = await import('@/lib/repository/entries')
  const { createEncryptedBackup, restoreEncryptedBackup } = await import('@/lib/export/backup')
  await ensureBootstrap()
  assert.equal(await db.entries.count(), 1)
  const initial = emptyNote()
  const itemId = crypto.randomUUID()
  const saved = await saveNote({ ...initial, title: 'Rencana', checklist: [{ id: itemId, text: 'Kirim desain', checked: false, createdAt: initial.createdAt }] }, null)
  const withMedia = await addNoteMedia(saved.id, new Blob(['image-content'], { type: 'image/png' }), 'sketsa.png', 'image', null)
  const checked = await saveNote({ ...saved, checklist: [{ ...saved.checklist[0], checked: true, checkedAt: '2026-10-01T10:00:00.000Z' }], checkEvents: [{ id: crypto.randomUUID(), itemId, text: 'Kirim desain', checked: true, at: '2026-10-01T10:00:00.000Z' }], media: [withMedia], mindNodes: [{ id: 'root', parentId: null, text: 'Desain', color: '#6366f1' }] }, null)
  assert.equal((await listNoteHistory(saved.id, null)).length, 1)
  assert.equal((await getNoteMedia(withMedia.id, null)).size, 13)

  const vaultKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  await migratePlaintextToVault(vaultKey)
  const settings = await db.settings.get('app')
  assert.ok(settings)
  await db.settings.put({ ...settings!, security: { enabled: true, pinSalt: '', pinIterations: 1, wrappedKey: '', wrapIv: '', autoLockMin: 5, enabledAt: new Date().toISOString() } })
  assert.equal(await db.notes.count(), 0)
  assert.equal((await listNotes(null)).length, 0)
  assert.equal((await listNotes(vaultKey))[0].checkEvents.length, 1)
  assert.equal((await listNoteHistory(saved.id, vaultKey)).length, 1)
  assert.equal((await getNoteMedia(withMedia.id, vaultKey)).size, 13)
  await saveNote({ ...checked, media: [] }, vaultKey)

  let backup: Blob | undefined
  const oldCreate = URL.createObjectURL, oldRevoke = URL.revokeObjectURL, oldDocument = globalThis.document
  URL.createObjectURL = blob => { if (blob instanceof Blob) backup = blob; return 'blob:test-note-backup' }
  URL.revokeObjectURL = () => {}
  globalThis.document = { createElement: () => ({ href: '', download: '', click: () => {} }) } as unknown as Document
  try {
    await createEncryptedBackup('long-password', vaultKey)
    assert.ok(backup)
    await restoreEncryptedBackup(new File([backup!], 'notes.lkbackup'), 'long-password')
    assert.equal((await listNotes(null))[0].mindNodes[0].text, 'Desain')
    assert.equal((await listNoteHistory(saved.id, null)).length, 2)
    assert.equal((await listNoteHistory(saved.id, null))[0].note.media[0].id, withMedia.id)
    assert.equal((await getNoteMedia(withMedia.id, null)).size, 13)
    assert.equal(await db.entries.count(), 1)
  } finally { URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke; globalThis.document = oldDocument }

  await saveNote({ ...checked, deletedAt: '2026-08-01T00:00:00.000Z' }, null)
  assert.equal(await purgeExpiredNotes(Date.parse('2026-10-01T00:00:00.000Z')), 1)
  assert.equal(await db.notes.count(), 0)
  assert.equal(await db.noteMedia.count(), 0)
  assert.equal(await db.noteHistory.count(), 0)
  await db.settings.put({ ...(await db.settings.get('app'))!, security: { enabled: true, pinSalt: '', pinIterations: 1, wrappedKey: '', wrapIv: '', autoLockMin: 5, enabledAt: new Date().toISOString() } })
  await saveNote({ ...emptyNote(), title: 'Sampah terenkripsi', deletedAt: '2026-08-01T00:00:00.000Z' }, vaultKey)
  assert.equal(await purgeExpiredNotes(Date.parse('2026-10-01T00:00:00.000Z')), 1)
  assert.equal(await db.secureNotes.count(), 0)
  db.close()
  await db.delete()
})
