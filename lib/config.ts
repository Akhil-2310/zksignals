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
    vkHash: process.env.SEMAPHORE_VK_HASH || '0xe8feeb86e417bd8bb91670d860cb74e9fac3b127a91cb7f593e59070533a61cf',
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
