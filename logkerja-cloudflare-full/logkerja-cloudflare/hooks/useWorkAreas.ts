'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/db'
import { GENERAL_AREA } from '@/lib/work-areas'

export function useWorkAreas() {
  return useLiveQuery(() => db.workAreas.toArray(), [], [GENERAL_AREA])
}
