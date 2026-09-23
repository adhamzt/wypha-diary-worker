import type { WorkEntry } from '@/types'
import { localDateKey } from '@/lib/date'

export function calculateStreak(entries: WorkEntry[]) {
  const dates = new Set(entries.filter((e) => !e.archived).map((e) => e.date))
  let streak = 0
  const cursor = new Date()
  const todayKey = localDateKey(cursor)
  if (!dates.has(todayKey)) cursor.setDate(cursor.getDate() - 1)
  while (dates.has(localDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function dateRange(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - Math.max(0, days - 1))
  return { start: localDateKey(start), end: localDateKey(end) }
}

export function filterRange(entries: WorkEntry[], start: string, end: string) {
  return entries.filter((e) => e.date >= start && e.date <= end && !e.archived)
}
