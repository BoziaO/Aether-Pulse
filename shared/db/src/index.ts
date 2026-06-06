import mongoose from 'mongoose'

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to configure MongoDB connection string?'
  )
}

let isConnected = false

export async function connectDb(): Promise<void> {
  if (isConnected) return

  try {
    await mongoose.connect(process.env.DATABASE_URL!, {
      dbName: undefined, // taken from the URI
    })
    isConnected = true
    console.log('[db] Connected to MongoDB')
  } catch (error: any) {
    console.error('\n========================================================================')
    console.error('ERROR: Could not connect to MongoDB!')
    console.error(`DATABASE_URL: ${process.env.DATABASE_URL}`)
    console.error(`Details: ${error.message}`)
    console.error('\nPlease make sure your MongoDB instance is running locally on port 27017,')
    console.error('or update DATABASE_URL in your .env file with a valid connection string.')
    console.error('========================================================================\n')
    throw error
  }
}

export { mongoose }
export * from './schema/index.js'
