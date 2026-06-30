const ALGO = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16
const ITERATIONS = 100000

function toBuf(data: string): ArrayBuffer {
  return new TextEncoder().encode(data).buffer as ArrayBuffer
}

function fromBuffer(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

function generateSalt(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH)).buffer as ArrayBuffer
}

function generateIV(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH)).buffer as ArrayBuffer
}

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toBuf(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey']
  )
}

async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export interface EncryptedData {
  data: string
  iv: string
  salt?: string
}

export interface KeyPair {
  publicKey: string
  privateKey: string
}

export const e2e = {
  async encrypt(plaintext: string, password: string): Promise<EncryptedData> {
    const salt = generateSalt()
    const iv = generateIV()
    const key = await deriveKey(password, salt)

    const encrypted = await crypto.subtle.encrypt(
      { name: ALGO, iv: new Uint8Array(iv) },
      key,
      toBuf(plaintext)
    )

    return {
      data: bufferToBase64(encrypted),
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt),
    }
  },

  async decrypt(encrypted: EncryptedData, password: string): Promise<string> {
    const salt = base64ToBuffer(encrypted.salt!)
    const iv = base64ToBuffer(encrypted.iv)
    const key = await deriveKey(password, salt)

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv: new Uint8Array(iv) },
      key,
      base64ToBuffer(encrypted.data)
    )

    return fromBuffer(decrypted)
  },

  async encryptLocal(data: string, userPassword: string): Promise<EncryptedData> {
    return e2e.encrypt(data, userPassword)
  },

  async decryptLocal(encrypted: EncryptedData, userPassword: string): Promise<string> {
    return e2e.decrypt(encrypted, userPassword)
  },

  generateKeyPair,

  deriveSharedSecret,

  async encryptForUser(plaintext: string, recipientPublicKey: string, senderPrivateKey: string): Promise<EncryptedData> {
    const pubKey = await crypto.subtle.importKey(
      'spki',
      base64ToBuffer(recipientPublicKey),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    )

    const privKey = await crypto.subtle.importKey(
      'pkcs8',
      base64ToBuffer(senderPrivateKey),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveKey']
    )

    const sharedKey = await deriveSharedSecret(privKey, pubKey)
    const iv = generateIV()

    const encrypted = await crypto.subtle.encrypt(
      { name: ALGO, iv: new Uint8Array(iv) },
      sharedKey,
      toBuf(plaintext)
    )

    return {
      data: bufferToBase64(encrypted),
      iv: bufferToBase64(iv),
    }
  },

  async decryptFromUser(encrypted: EncryptedData, senderPublicKey: string, recipientPrivateKey: string): Promise<string> {
    const pubKey = await crypto.subtle.importKey(
      'spki',
      base64ToBuffer(senderPublicKey),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    )

    const privKey = await crypto.subtle.importKey(
      'pkcs8',
      base64ToBuffer(recipientPrivateKey),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveKey']
    )

    const sharedKey = await deriveSharedSecret(privKey, pubKey)
    const iv = base64ToBuffer(encrypted.iv)

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv: new Uint8Array(iv) },
      sharedKey,
      base64ToBuffer(encrypted.data)
    )

    return fromBuffer(decrypted)
  },

  async exportPublicKey(keyPair: CryptoKeyPair): Promise<string> {
    const exported = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    return bufferToBase64(exported)
  },

  async exportPrivateKey(keyPair: CryptoKeyPair): Promise<string> {
    const exported = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    return bufferToBase64(exported)
  },

  generatePassphrase(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return bufferToBase64(array.buffer as ArrayBuffer)
  },
}
