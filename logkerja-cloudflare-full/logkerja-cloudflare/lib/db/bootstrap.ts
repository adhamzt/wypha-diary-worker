import { db } from './db'
import { defaultSettings, defaultTemplates } from './defaults'
import { GENERAL_AREA, GENERAL_AREA_ID } from '@/lib/work-areas'

export async function ensureBootstrap() {
  let settings = await db.settings.get('app')
  if (!settings) {
    settings = defaultSettings()
    await db.settings.put(settings)
  } else {
    const patched = { ...defaultSettings(), ...settings, updatedAt: settings.updatedAt || new Date().toISOString() }
    await db.settings.put(patched)
  }
  const count = await db.templates.count()
  if (count === 0) await db.templates.bulkPut(defaultTemplates)
  if (!await db.workAreas.get(GENERAL_AREA_ID)) await db.workAreas.put(GENERAL_AREA)
}
