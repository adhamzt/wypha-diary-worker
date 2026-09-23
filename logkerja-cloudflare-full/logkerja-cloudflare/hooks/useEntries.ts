'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/db'
import { listEntries } from '@/lib/repository/entries'
import { useSecurity } from '@/components/security/SecurityProvider'

export function useEntries() {
  const { key, settings, locked } = useSecurity()
  return useLiveQuery(async () => {
    // Touch both tables so Dexie can react to either plaintext or encrypted mutations.
    await Promise.all([db.entries.count(), db.secureEntries.count()])
    if (locked) return []
    return listEntries(key)
  }, [key, settings?.security?.enabled, locked], [])
}
