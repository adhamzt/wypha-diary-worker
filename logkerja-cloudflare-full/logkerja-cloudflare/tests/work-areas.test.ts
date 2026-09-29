import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import Dexie from 'dexie'

test('v2 log lama tetap di Global/Umum dan pekerjaan baru tidak memecah record', async () => {
  const legacy = new Dexie('workdiary')
  legacy.version(2).stores({ entries: 'id, date, project, client, mood, createdAt, updatedAt, *tags' })
  await legacy.table('entries').put({
    id: 'old-1', date: '2026-09-01', project: 'Laporan', activity: 'Catatan lama',
    mood: 3, tags: [], attachments: [], createdAt: '2026-09-01', updatedAt: '2026-09-01'
  })
  legacy.close()

  const { db } = await import('@/lib/db/db')
  const { ensureBootstrap } = await import('@/lib/db/bootstrap')
  const { createEntry, listEntries, updateEntry } = await import('@/lib/repository/entries')
  const { areaId, GENERAL_AREA_ID, saveWorkArea, setWorkAreaArchived } = await import('@/lib/work-areas')
  await ensureBootstrap()
  const designer = await saveWorkArea('Desainer', '#0891b2')
  const home = await saveWorkArea('Rumah', '#059669')
  const created = await createEntry({
    date: '2026-09-02', workAreaId: designer, activity: 'Membuat poster', project: 'Klien A',
    mood: 4, tags: [], files: []
  }, null)
  await createEntry({date: '2026-09-03', workAreaId: home, activity: 'Memperbaiki rumah', mood: 4, tags: [], files: []}, null)

  const global = await listEntries(null)
  assert.equal(global.length, 3)
  assert.equal(areaId(global.find(entry => entry.id === 'old-1')!), GENERAL_AREA_ID)
  assert.equal(global.filter(entry => areaId(entry) === designer).length, 1)
  assert.equal(global.filter(entry => areaId(entry) === home).length, 1)

  await saveWorkArea('Desain Grafis', '#db2777', designer)
  await setWorkAreaArchived(designer, true)
  assert.equal((await db.workAreas.get(designer))?.name, 'Desain Grafis')
  assert.equal((await db.workAreas.get(designer))?.archived, true)
  assert.equal((await listEntries(null)).length, 3)

  await updateEntry({...created, workAreaId: home}, null)
  assert.equal((await listEntries(null)).filter(entry => areaId(entry) === home).length, 2)
  assert.equal((await db.entries.get('old-1'))?.workAreaId, undefined)

  const { createEncryptedBackup, restoreEncryptedBackup } = await import('@/lib/export/backup')
  let backup: Blob | undefined
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL
  const originalDocument = globalThis.document
  URL.createObjectURL = blob => { if (blob instanceof Blob) backup = blob; return 'blob:test-backup' }
  URL.revokeObjectURL = () => {}
  globalThis.document = { createElement: () => ({ href: '', download: '', click: () => {} }) } as unknown as Document
  try {
    await createEncryptedBackup('password-test', null)
    assert.ok(backup)
    await db.workAreas.clear()
    assert.equal(await restoreEncryptedBackup(new File([backup], 'test.lkbackup'), 'password-test'), 3)
    assert.equal((await db.workAreas.get(designer))?.name, 'Desain Grafis')
    assert.equal((await listEntries(null)).filter(entry => areaId(entry) === home).length, 2)
    const { importCSV } = await import('@/lib/integrations/importers')
    await importCSV('date,workArea,activity\n2026-09-04,Administratif,Membuat laporan\n2026-09-05,Desain Grafis,Membuat logo', null)
    const imported = await listEntries(null)
    assert.equal(imported.length, 5)
    assert.equal(imported.find(entry => entry.activity === 'Membuat logo')?.workAreaId, designer)
    assert.equal((await db.workAreas.toArray()).some(area => area.name === 'Administratif'), true)
  } finally {
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
    globalThis.document = originalDocument
  }
  db.close()
  await db.delete()
})
