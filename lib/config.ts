// Configuration for AnonSignals app
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  zkVerify: {
    relayerUrl: process.env.ZK_VERIFY_RELAYER_URL || 'https://relayer-api.horizenlabs.io/api/v1',
    apiKey: process.env.ZK_VERIFY_API_KEY || "6a28b4aa810b6dc10b3dff9d8e185008f59423c7",
  },
  semaphore: {
    vkHash: process.env.SEMAPHORE_VK_HASH || '0x34dbbf93056bcae972f337f57a8283fce5f71cfd97de4241e0645c914a3e635f',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
} as const

// Validate required environment variables
export function validateConfig() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ZK_VERIFY_API_KEY',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
