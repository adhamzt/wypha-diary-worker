import type { BiometricVaultConfig, SecurityConfig } from '@/types'
import { base64ToBytes, bytesToBase64, randomBytes, utf8 } from './encoding'

const AES = 'AES-GCM'
const SESSION_KEY = 'logkerja-session-dek'
const PRF_LABEL = 'LogKerja biometric vault v1'

async function importAes(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, AES, true, ['encrypt', 'decrypt'])
}

async function derivePinKey(pin: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', utf8(pin), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: AES, length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function wrapRawKey(rawDek: Uint8Array<ArrayBuffer>, wrappingKey: CryptoKey) {
  const iv = randomBytes(12)
  const cipher = await crypto.subtle.encrypt({ name: AES, iv }, wrappingKey, rawDek)
  return { wrappedKey: bytesToBase64(cipher), wrapIv: bytesToBase64(iv) }
}

async function unwrapRawKey(wrappedKey: string, wrapIv: string, wrappingKey: CryptoKey) {
  const raw = await crypto.subtle.decrypt(
    { name: AES, iv: base64ToBytes(wrapIv) },
    wrappingKey,
    base64ToBytes(wrappedKey)
  )
  return new Uint8Array(raw)
}

export async function createPinVault(pin: string, autoLockMin = 5): Promise<{ config: SecurityConfig; key: CryptoKey }> {
  if (pin.length < 6) throw new Error('PIN minimal 6 digit/karakter.')
  const dek = randomBytes(32)
  const salt = randomBytes(16)
  const iterations = 310_000
  const pinKey = await derivePinKey(pin, salt, iterations)
  const wrapped = await wrapRawKey(dek, pinKey)
  const key = await importAes(dek)
  return {
    config: {
      enabled: true,
      pinSalt: bytesToBase64(salt),
      pinIterations: iterations,
      wrappedKey: wrapped.wrappedKey,
      wrapIv: wrapped.wrapIv,
      autoLockMin,
      enabledAt: new Date().toISOString()
    },
    key
  }
}

export async function unlockWithPin(pin: string, config: SecurityConfig): Promise<CryptoKey> {
  const pinKey = await derivePinKey(pin, base64ToBytes(config.pinSalt), config.pinIterations)
  const raw = await unwrapRawKey(config.wrappedKey, config.wrapIv, pinKey)
  return importAes(raw)
}

export async function changePin(oldPin: string, newPin: string, config: SecurityConfig): Promise<SecurityConfig> {
  const key = await unlockWithPin(oldPin, config)
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  const salt = randomBytes(16)
  const pinKey = await derivePinKey(newPin, salt, config.pinIterations)
  const wrapped = await wrapRawKey(raw, pinKey)
  return { ...config, pinSalt: bytesToBase64(salt), wrappedKey: wrapped.wrappedKey, wrapIv: wrapped.wrapIv }
}

export function saveSessionKey(key: CryptoKey) {
  return crypto.subtle.exportKey('raw', key).then((raw) => sessionStorage.setItem(SESSION_KEY, bytesToBase64(raw)))
}

export async function loadSessionKey(): Promise<CryptoKey | null> {
  const stored = sessionStorage.getItem(SESSION_KEY)
  if (!stored) return null
  try { return await importAes(base64ToBytes(stored)) } catch { return null }
}

export function clearSessionKey() { sessionStorage.removeItem(SESSION_KEY) }

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function wrappingKeyFromPrf(bytes: Uint8Array<ArrayBuffer>) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return importAes(new Uint8Array(digest))
}

export async function registerBiometric(key: CryptoKey): Promise<BiometricVaultConfig> {
  if (!window.isSecureContext || !('credentials' in navigator)) throw new Error('Biometric membutuhkan HTTPS dan WebAuthn.')
  const challenge = randomBytes(32)
  const userId = randomBytes(32)
  const prfSalt = utf8(PRF_LABEL)
  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: { name: 'LogKerja', id: location.hostname },
    user: { id: userId, name: `logkerja-${Date.now()}`, displayName: 'LogKerja Local Vault' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
    timeout: 60_000,
    attestation: 'none',
    extensions: { prf: { eval: { first: prfSalt } } } as AuthenticationExtensionsClientInputs
  }
  const created = await navigator.credentials.create({ publicKey }) as PublicKeyCredential | null
  if (!created) throw new Error('Pendaftaran biometric dibatalkan.')
  let output = (created.getClientExtensionResults() as any)?.prf?.results?.first as ArrayBuffer | undefined
  if (!output) {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        rpId: location.hostname,
        allowCredentials: [{ type: 'public-key', id: created.rawId }],
        userVerification: 'required',
        timeout: 60_000,
        extensions: { prf: { eval: { first: prfSalt } } } as AuthenticationExtensionsClientInputs
      }
    }) as PublicKeyCredential | null
    output = (assertion?.getClientExtensionResults() as any)?.prf?.results?.first
  }
  if (!output) throw new Error('Authenticator ini tidak menyediakan WebAuthn PRF. Gunakan PIN sebagai fallback.')
  const wrapKey = await wrappingKeyFromPrf(new Uint8Array(output))
  const rawDek = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  const wrapped = await wrapRawKey(rawDek, wrapKey)
  return {
    credentialId: toBase64Url(created.rawId),
    prfSalt: bytesToBase64(prfSalt),
    wrappedKey: wrapped.wrappedKey,
    wrapIv: wrapped.wrapIv
  }
}

function fromBase64Url(value: string) {
  let normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  while (normalized.length % 4) normalized += '='
  return base64ToBytes(normalized)
}

export async function unlockWithBiometric(config: BiometricVaultConfig): Promise<CryptoKey> {
  if (!window.isSecureContext || !('credentials' in navigator)) throw new Error('WebAuthn tidak tersedia.')
  const credentialId = fromBase64Url(config.credentialId)
  const prfSalt = base64ToBytes(config.prfSalt)
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      rpId: location.hostname,
      allowCredentials: [{ type: 'public-key', id: credentialId }],
      userVerification: 'required',
      timeout: 60_000,
      extensions: { prf: { eval: { first: prfSalt } } } as AuthenticationExtensionsClientInputs
    }
  }) as PublicKeyCredential | null
  const output = (assertion?.getClientExtensionResults() as any)?.prf?.results?.first as ArrayBuffer | undefined
  if (!output) throw new Error('Biometric PRF tidak tersedia pada perangkat/browser ini.')
  const wrapKey = await wrappingKeyFromPrf(new Uint8Array(output))
  const raw = await unwrapRawKey(config.wrappedKey, config.wrapIv, wrapKey)
  return importAes(raw)
}
