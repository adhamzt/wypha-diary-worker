import { db } from '@/lib/db/db'
import type { WorkArea, WorkEntry } from '@/types'

export const GENERAL_AREA_ID = 'general'
export const GENERAL_AREA: WorkArea = {
  id: GENERAL_AREA_ID, name: 'Umum', color: '#6366f1', archived: false,
  createdAt: '2026-01-01T00:00:00.000Z'
}

export const AREA_COLORS = ['#6366f1', '#0891b2', '#059669', '#ea580c', '#db2777', '#7c3aed']

export function areaId(entry: WorkEntry) { return entry.workAreaId || GENERAL_AREA_ID }
export function areaName(areas: WorkArea[], id?: string) {
  return areas.find(area => area.id === (id || GENERAL_AREA_ID))?.name || 'Umum'
}

export async function saveWorkArea(name: string, color: string, id?: string) {
  const normalized = name.trim().replace(/\s+/g, ' ')
  if (!normalized || normalized.length > 50) throw new Error('Nama jenis pekerjaan harus 1–50 karakter.')
  if (!AREA_COLORS.includes(color)) throw new Error('Warna tidak dikenali.')
  const areas = await db.workAreas.toArray()
  if (areas.some(area => area.id !== id && area.name.toLocaleLowerCase('id-ID') === normalized.toLocaleLowerCase('id-ID')))
    throw new Error('Nama jenis pekerjaan sudah dipakai.')
  if (id) {
    const existing = await db.workAreas.get(id)
    if (!existing) throw new Error('Jenis pekerjaan tidak ditemukan.')
    if (id === GENERAL_AREA_ID) throw new Error('Nama Umum tidak dapat diubah.')
    await db.workAreas.put({ ...existing, name: normalized, color })
    return id
  }
  const newId = crypto.randomUUID()
  await db.workAreas.put({ id: newId, name: normalized, color, archived: false, createdAt: new Date().toISOString() })
  return newId
}

export async function setWorkAreaArchived(id: string, archived: boolean) {
  if (id === GENERAL_AREA_ID) throw new Error('Umum selalu tersedia.')
  const area = await db.workAreas.get(id)
  if (!area) throw new Error('Jenis pekerjaan tidak ditemukan.')
  await db.workAreas.put({ ...area, archived })
}
