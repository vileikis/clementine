/**
 * Token Encryption Service
 *
 * AES-256-GCM encryption/decryption for Dropbox refresh tokens.
 * Key is loaded from DROPBOX_TOKEN_ENCRYPTION_KEY environment variable.
 *
 * Storage format: {iv}:{authTag}:{ciphertext} (base64-encoded components)
 */
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const hexKey = process.env['DROPBOX_TOKEN_ENCRYPTION_KEY']
  if (!hexKey) {
    throw new Error('DROPBOX_TOKEN_ENCRYPTION_KEY environment variable is not set')
  }
  return Buffer.from(hexKey, 'hex')
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: {iv}:{authTag}:{ciphertext}
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 *
 * @param encryptedValue - Encrypted string in format: {iv}:{authTag}:{ciphertext}
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedValue: string): string {
  const key = getEncryptionKey()
  const parts = encryptedValue.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value format')
  }

  const [ivB64, authTagB64, ciphertextB64] = parts as [string, string, string]
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const ciphertext = Buffer.from(ciphertextB64, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}
