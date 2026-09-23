import type { EntryDraft, WorkEntry } from '@/types'
import { base64ToBytes, bytesToBase64, decodeUtf8, randomBytes, utf8 } from './encoding'

export async function encryptJson<T>(value: T, key: CryptoKey) {
  const iv = randomBytes(12)
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, utf8(JSON.stringify(value)))
  return { cipher, iv: bytesToBase64(iv) }
}

export async function decryptJson<T>(cipher: ArrayBuffer, iv: string, key: CryptoKey): Promise<T> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(iv) }, key, cipher)
  return JSON.parse(decodeUtf8(plain)) as T
}

export async function encryptBlob(blob: Blob, key: CryptoKey) {
  const iv = randomBytes(12)
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await blob.arrayBuffer())
  return { cipher, iv: bytesToBase64(iv) }
}

export async function decryptBlob(cipher: ArrayBuffer, iv: string, type: string, key: CryptoKey) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(iv) }, key, cipher)
  return new Blob([plain], { type })
}

export type EncryptableRecord = WorkEntry | EntryDraft
