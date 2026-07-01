import mongoose from 'mongoose'

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to configure MongoDB connection string?'
  )
}

const CONNECTION_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
  heartbeatFrequencyMS: 10_000,
  retryWrites: true,
  w: 'majority',
}

let isConnected = false
let isConnecting = false
let connectPromise: Promise<void> | null = null
let connectionLock = false

function setupConnectionEvents() {
  const conn = mongoose.connection

  conn.on('connected', () => {
    isConnected = true
    console.log('[db] Connected to MongoDB')
  })

  conn.on('disconnected', () => {
    isConnected = false
    console.warn('[db] Disconnected from MongoDB')
  })

  conn.on('reconnected', () => {
    isConnected = true
    console.log('[db] Reconnected to MongoDB')
  })

  conn.on('error', (err) => {
    console.error('[db] MongoDB connection error:', err.message)
  })

  conn.on('fullsetup', () => {
    console.log('[db] All replica set members connected')
  })

  conn.on('close', () => {
    isConnected = false
    console.log('[db] MongoDB connection closed')
  })
}

export async function connectDb(): Promise<void> {
  if (isConnected) return
  if (isConnecting && connectPromise) return connectPromise

  if (connectionLock) {
    return connectPromise!
  }

  connectionLock = true
  isConnecting = true
  setupConnectionEvents()

  connectPromise = (async () => {
    try {
      await mongoose.connect(process.env.DATABASE_URL!, CONNECTION_OPTIONS)
      // Verify connection is fully ready
      if (mongoose.connection.readyState !== 1) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Connection readyState timeout'))
          }, 5000)
          mongoose.connection.once('connected', () => {
            clearTimeout(timeout)
            resolve()
          })
          mongoose.connection.once('error', (err) => {
            clearTimeout(timeout)
            reject(err)
          })
        })
      }
      isConnected = true
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('\n========================================================================')
      console.error('ERROR: Could not connect to MongoDB!')
      console.error(`DATABASE_URL: ${process.env.DATABASE_URL}`)
      console.error(`Details: ${msg}`)
      console.error('\nPlease make sure your MongoDB instance is running locally on port 27017,')
      console.error('or update DATABASE_URL in your .env file with a valid connection string.')
      console.error('========================================================================\n')
      throw error
    } finally {
      isConnecting = false
      connectionLock = false
    }
  })()

  return connectPromise
}

export async function disconnectDb(): Promise<void> {
  if (!isConnected && !isConnecting) return
  try {
    await mongoose.disconnect()
    isConnected = false
    console.log('[db] Disconnected from MongoDB')
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[db] Error disconnecting from MongoDB:', msg)
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1
}

export async function checkDbHealth(): Promise<{ ok: boolean; latencyMs?: number }> {
  try {
    const start = Date.now()
    await mongoose.connection.db!.admin().ping()
    const latencyMs = Date.now() - start
    return { ok: true, latencyMs }
  } catch {
    return { ok: false }
  }
}

export { mongoose }
export * from './schema/index.js'
