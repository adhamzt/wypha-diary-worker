export interface PendingShare {
  id: string
  title?: string
  text?: string
  url?: string
  files: File[]
  createdAt: string
}

const DB_NAME = 'workdiary-share'
const STORE_NAME = 'pending'

function openShareDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function consumeLatestPendingShare(): Promise<PendingShare | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null
  const database = await openShareDb()

  const shares = await new Promise<PendingShare[]>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result as PendingShare[])
    req.onerror = () => reject(req.error)
  })

  if (!shares.length) {
    database.close()
    return null
  }

  shares.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const latest = shares[0]

  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    // Consume the newest share and remove stale queued shares to minimize
    // plaintext data lingering in the temporary service-worker inbox.
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  database.close()
  return latest
}
