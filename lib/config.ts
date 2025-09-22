const defaultSemaphoreVkHash = process.env.NEXT_PUBLIC_SEMAPHORE_VK_HASH


// Accepts SEMAPHORE_VK_HASHES='{"3":"0x...","20":"0x..."}' to map depth→vk hash
const semaphoreVkHashes: Record<number, string> = (() => {
  const rawMap = process.env.NEXT_PUBLIC_SEMAPHORE_VK_HASHES
  if (!rawMap) {
    return {}
  }

  try {
    const trimmed = rawMap.trim()
    const unwrapped = trimmed.startsWith("'") && trimmed.endsWith("'")
      ? trimmed.slice(1, -1)
      : trimmed

    const parsed = JSON.parse(unwrapped) as Record<string, string>
    return Object.entries(parsed).reduce<Record<number, string>>((acc, [depth, hash]) => {
      const depthNumber = Number(depth)
      if (!Number.isFinite(depthNumber)) {
        return acc
      }
      if (typeof hash === 'string' && hash.length > 0) {
        acc[depthNumber] = hash
      }
      return acc
    }, {})
  } catch (error) {
    console.warn('Invalid SEMAPHORE_VK_HASHES value. Expected JSON object mapping depths to vk hashes.')
    return {}
  }
})()

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
    defaultVkHash: defaultSemaphoreVkHash,
    vkHashes: semaphoreVkHashes,
    vkHash: '0x5c2970f3e098f11e33e3758366d2e514850188af36f7399293cda27961004932', // fallback
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
