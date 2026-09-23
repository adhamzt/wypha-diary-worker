import { db } from './db'
import { defaultSettings, defaultTemplates } from './defaults'

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
}
