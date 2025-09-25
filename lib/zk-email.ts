import { JsonRpcProvider } from 'ethers'

import { config } from './config'
import {
  AggregationArtifacts,
  aggregationArtifactsToParams,
  computeAggregationLeaf,
  extractAggregationArtifacts,
  normalizePublicSignals,
  verifyProofAggregationOnChain,
} from './zk-aggregation'

export interface EmailProofArtifacts {
  proof: any
  publicSignals: string[]
  vkHash: string
}

export interface EmailVerificationResult {
  isValid: boolean
  jobId: string
  proofData?: EmailProofArtifacts
  error?: string
}

export interface EmailBlueprint {
  githubUsername: string
  blueprintName: string
  version: string
}

// Type for ZK Email proof structure
type ZkEmailProof = {
  props: {
    proofData: any
    publicOutputs?: any[]
    publicData?: any[]
  }
}

export interface EmailVerificationStatusData {
  raw: any
  aggregation?: AggregationArtifacts
}

export interface VerificationPollingOptions {
  maxAttempts?: number
  intervalMs?: number
  proofData?: Pick<EmailProofArtifacts, 'publicSignals' | 'vkHash'>
}

// Re-export helpers for convenience
export {
  aggregationArtifactsToParams,
  computeAggregationLeaf,
  verifyProofAggregationOnChain,
} from './zk-aggregation'
export type { AggregationArtifacts } from './zk-aggregation'

export function parseEmailBlueprint(blueprintString: string): EmailBlueprint {
  // Parse format: username/blueprint-name@version
  const parts = blueprintString.split('@')
  if (parts.length !== 2) {
    throw new Error('Invalid blueprint format. Expected: username/blueprint-name@version')
  }
  
  const [userAndBlueprint, version] = parts
  const blueprintParts = userAndBlueprint.split('/')
  
  if (blueprintParts.length !== 2) {
    throw new Error('Invalid blueprint format. Expected: username/blueprint-name@version')
  }
  
  const [githubUsername, blueprintName] = blueprintParts
  
  return {
    githubUsername,
    blueprintName,
    version
  }
}

// Cache for registered vkHashes to avoid re-registering
const vkHashCache = new Map<string, string>()

async function ensureVkHash(vkeyObj: any, blueprintSlug: string): Promise<string> {
  // Check cache first
  if (vkHashCache.has(blueprintSlug)) {
    return vkHashCache.get(blueprintSlug)!
  }

  // Validate API key exists
  if (!config.zkVerify.apiKey) {
    throw new Error('ZK_VERIFY_API_KEY environment variable is not set. Please add it to your .env.local file.')
  }

  // Register the vkey with ZK Verify relayer
  const regParams = {
    proofType: 'groth16',
    proofOptions: {
      library: 'snarkjs',
      curve: 'bn128',
    },
    vk: vkeyObj,
  }

  const response = await fetch(
    `${config.zkVerify.relayerUrl}/register-vk/${config.zkVerify.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(regParams),
    }
  )

  let data: any
  let vkHash: string

  if (!response.ok) {
    const errorText = await response.text()
    
    // Check if it's the "already registered" error
    try {
      const errorData = JSON.parse(errorText)
      if (errorData.code === 'REGISTER_VK_FAILED' && 
          errorData.message?.includes('already registered') &&
          errorData.meta?.vkHash) {
        // VK is already registered, use the existing hash
        vkHash = errorData.meta.vkHash
        console.log(`VK already registered for ${blueprintSlug}, using existing hash: ${vkHash}`)
      } else {
        throw new Error(`Failed to register vkey: ${response.status} ${response.statusText}. ${errorText}`)
      }
    } catch (parseError) {
      // If we can't parse the error, throw the original error
      throw new Error(`Failed to register vkey: ${response.status} ${response.statusText}. ${errorText}`)
    }
  } else {
    // Successful registration
    data = await response.json()
    vkHash = data?.vkHash ?? data?.meta?.vkHash

    if (!vkHash) {
      throw new Error('vkHash missing from register-vk response')
    }
  }

  // Cache the result
  vkHashCache.set(blueprintSlug, vkHash)
  return vkHash
}

export async function verifyEmailWithBlueprint(
  emlFile: File,
  blueprintString: string
): Promise<EmailVerificationResult> {
  try {
    // Initialize ZK Email SDK
    const { initZkEmailSdk } = await import('@zk-email/sdk')
    const sdk = initZkEmailSdk()
    
    // Get blueprint and vkey
    const blueprint = await sdk.getBlueprint(blueprintString)
    const vkeyStr = await blueprint.getVkey()
    const vkeyObj = JSON.parse(vkeyStr)
    
    // Register vkey and get vkHash
    const vkHash = await ensureVkHash(vkeyObj, blueprintString)
    
    // Read the EML file content
    const emlContent = await emlFile.text()
    
    // Generate ZK Email proof
    const prover = blueprint.createProver() // Uses remote proving by default
    const proof = (await prover.generateProof(emlContent)) as ZkEmailProof
    
    // Extract proof components
    const snarkProof = proof.props.proofData
    const publicSignalsRaw = proof.props.publicOutputs ?? proof.props.publicData
    
    if (!snarkProof || !publicSignalsRaw) {
      throw new Error('Missing proofData or public signals from zkEmail proof')
    }

    const publicSignals = normalizePublicSignals(publicSignalsRaw)
    
    // Submit proof to ZK Verify relayer
    const submitParams: Record<string, unknown> = {
      proofType: 'groth16',
      vkRegistered: true, // We're using a registered vkHash
      proofOptions: {
        library: 'snarkjs',
        curve: 'bn128',
      },
      proofData: {
        proof: snarkProof,
        publicSignals,
        vk: vkHash, // Pass the vkHash (not the full vkey)
      },
    }

    if (config.zkVerify.chainId) {
      submitParams.chainId = config.zkVerify.chainId
    }
    
    const submitResponse = await fetch(
      `${config.zkVerify.relayerUrl}/submit-proof/${config.zkVerify.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitParams),
      }
    )
    
    if (!submitResponse.ok) {
      throw new Error(`Failed to submit proof: ${submitResponse.statusText}`)
    }
    
    const submitData = await submitResponse.json()
    
    if (submitData.optimisticVerify !== 'success') {
      return {
        isValid: false,
        jobId: '',
        error: 'Optimistic verification failed - check proof artifacts'
      }
    }
    
    return {
      isValid: true,
      jobId: submitData.jobId,
      proofData: {
        proof: snarkProof,
        publicSignals,
        vkHash
      }
    }
    
  } catch (error) {
    console.error('Email verification error:', error)
    return {
      isValid: false,
      jobId: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Poll job status until completion
export async function waitForEmailVerification(
  jobId: string,
  options: VerificationPollingOptions = {}
): Promise<{ success: boolean; status: string; data?: EmailVerificationStatusData; error?: string }> {
  const {
    maxAttempts = 60,
    intervalMs = 5000,
    proofData,
  } = options

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const statusResponse = await fetch(
        `${config.zkVerify.relayerUrl}/job-status/${config.zkVerify.apiKey}/${jobId}`
      )
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.statusText}`)
      }
      
      const statusData = await statusResponse.json()
      const status = statusData.status
      
      console.log(`Email verification job status: ${status}`)
      
      const result: EmailVerificationStatusData = { raw: statusData }

      if (status === 'Aggregated') {
        const aggregation = extractAggregationArtifacts(statusData)

        if (aggregation && proofData) {
          try {
            const computedLeaf = computeAggregationLeaf(proofData.publicSignals, proofData.vkHash)
            aggregation.computedLeaf = computedLeaf
            aggregation.leafMatches = aggregation.leaf.toLowerCase() === computedLeaf.toLowerCase()
          } catch (error) {
            console.warn('Failed to recompute aggregation leaf', error)
          }
        }

        if (aggregation) {
          if (config.zkVerify.rpcUrl) {
            try {
              const provider = new JsonRpcProvider(config.zkVerify.rpcUrl)
              const verified = await verifyProofAggregationOnChain({
                ...aggregationArtifactsToParams(aggregation),
                runner: provider,
              })
              aggregation.onChainVerified = verified
              console.log('Email aggregation on-chain verification result:', verified)
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unknown error'
              aggregation.onChainVerificationError = message
              console.warn('Failed to verify email aggregation on-chain', error)
            }
          }

          result.aggregation = aggregation
        }
      }

      // Check for completion statuses
      if (status === 'Finalized' || status === 'Aggregated') {
        return {
          success: true,
          status,
          data: result
        }
      }
      
      // Check for failure statuses
      if (status === 'Failed' || status === 'Rejected') {
        return {
          success: false,
          status,
          error: `Verification failed with status: ${status}`
        }
      }
      
      // Continue polling for pending statuses
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
      
    } catch (error) {
      console.error('Error checking job status:', error)
      return {
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  return {
    success: false,
    status: 'timeout',
    error: 'Verification timeout - job did not complete in time'
  }
}

// Validate blueprint format
export function validateBlueprintFormat(blueprint: string): boolean {
  try {
    parseEmailBlueprint(blueprint)
    return true
  } catch {
    return false
  }
}

// Get blueprint examples for UI
export const BLUEPRINT_EXAMPLES = [
  'Akhil-2310/hackerhouse_india@v4',
  'Bisht13/SuccinctZKResidencyInvite@v3', 
] as const
