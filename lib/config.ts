const defaultSemaphoreVkHash = process.env.NEXT_PUBLIC_SEMAPHORE_VK_HASH

const DEFAULT_AGGREGATOR_ADDRESS = '0x201B6ba8EA862d83AAA03CFbaC962890c7a4d195'
const DEFAULT_DOMAIN_ID = 113
const DEFAULT_CHAIN_ID = 845320009
const DEFAULT_RPC_URL = 'https://horizen-rpc-testnet.appchain.base.org'
const DEFAULT_EXPLORER_BASE_URL = 'https://zkverify-testnet.subscan.io/extrinsic/'

const parseNumberKeyedMap = (raw?: string): Record<number, string> => {
  if (!raw) {
    return {}
  }

  try {
    const trimmed = raw.trim()
    const unwrapped = trimmed.startsWith("'") && trimmed.endsWith("'")
      ? trimmed.slice(1, -1)
      : trimmed

    const parsed = JSON.parse(unwrapped) as Record<string, string>
    return Object.entries(parsed).reduce<Record<number, string>>((acc, [depth, value]) => {
      const depthNumber = Number(depth)
      if (!Number.isFinite(depthNumber)) {
        return acc
      }
      if (typeof value === 'string' && value.length > 0) {
        acc[depthNumber] = value
      }
      return acc
    }, {})
  } catch (error) {
    console.warn('Invalid number-keyed map env value. Expected JSON object mapping tree depth to strings.')
    return {}
  }
}

const semaphoreVkHashes = parseNumberKeyedMap(
  process.env.NEXT_PUBLIC_SEMAPHORE_VK_HASHES || process.env.SEMAPHORE_VK_HASHES
)

const resolveOptionalNumber = (value?: string) => {
  if (!value) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const zkVerifyChainId = resolveOptionalNumber(
  process.env.NEXT_PUBLIC_ZK_VERIFY_CHAIN_ID || process.env.ZK_VERIFY_CHAIN_ID
) ?? DEFAULT_CHAIN_ID

const zkVerifyAggregatorAddress =
  process.env.NEXT_PUBLIC_ZK_VERIFY_AGGREGATOR_ADDRESS
  || process.env.ZK_VERIFY_AGGREGATOR_ADDRESS
  || DEFAULT_AGGREGATOR_ADDRESS

const zkVerifyDomainId = resolveOptionalNumber(
  process.env.NEXT_PUBLIC_ZK_VERIFY_DOMAIN_ID || process.env.ZK_VERIFY_DOMAIN_ID
) ?? DEFAULT_DOMAIN_ID

const zkVerifyRpcUrl =
  process.env.NEXT_PUBLIC_ZK_VERIFY_RPC_URL
  || process.env.ZK_VERIFY_RPC_URL
  || DEFAULT_RPC_URL

const zkVerifyExplorerBaseUrl =
  process.env.NEXT_PUBLIC_ZK_VERIFY_EXPLORER_BASE_URL
  || process.env.ZK_VERIFY_EXPLORER_BASE_URL
  || DEFAULT_EXPLORER_BASE_URL

const defaultSemaphoreAggregatorAddress =
  process.env.NEXT_PUBLIC_SEMAPHORE_AGGREGATOR_ADDRESS
  || process.env.SEMAPHORE_AGGREGATOR_ADDRESS
  || DEFAULT_AGGREGATOR_ADDRESS

const semaphoreAggregatorAddresses = parseNumberKeyedMap(
  process.env.NEXT_PUBLIC_SEMAPHORE_AGGREGATOR_ADDRESSES || process.env.SEMAPHORE_AGGREGATOR_ADDRESSES
)

// Configuration for AnonSignals app
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  zkVerify: {
    relayerUrl: process.env.ZK_VERIFY_RELAYER_URL || 'https://relayer-api.horizenlabs.io/api/v1',
    apiKey: process.env.ZK_VERIFY_API_KEY || '6a28b4aa810b6dc10b3dff9d8e185008f59423c7',
    chainId: zkVerifyChainId,
    aggregatorAddress: zkVerifyAggregatorAddress,
    domainId: zkVerifyDomainId,
    rpcUrl: zkVerifyRpcUrl,
    explorerBaseUrl: zkVerifyExplorerBaseUrl,
  },
  semaphore: {
    defaultVkHash: defaultSemaphoreVkHash,
    vkHashes: semaphoreVkHashes,
    vkHash: '0x5c2970f3e098f11e33e3758366d2e514850188af36f7399293cda27961004932', // fallback
    defaultAggregatorAddress: defaultSemaphoreAggregatorAddress,
    aggregatorAddresses: semaphoreAggregatorAddresses,
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
