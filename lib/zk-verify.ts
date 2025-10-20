import axios from 'axios'

import { config } from './config'
import { SemaphoreProofData } from './semaphore'
import { normalizePublicSignals } from './zk-aggregation'

export interface ZKVerifySubmissionResult {
  success: boolean
  proofHash: string
  jobId?: string // Raw jobId for polling status
  transactionId?: string
  error?: string
}

export interface ZKVerifyProofStatus {
  status: 'pending' | 'verified' | 'failed'
  proofHash: string
  transactionId?: string
  verificationTime?: string
  error?: string
}

export interface ZKVerifyProofPayload {
  proof: any // The actual proof data (Semaphore proof)
  publicInputs: string[] // Public inputs for verification
  proofType: 'semaphore' | 'zk-email'
  metadata: {
    groupId?: string
    action: 'join-group' | 'create-post' | 'cast-vote'
    timestamp: string
  }
}

console.log('vk map', config.semaphore.vkHashes)

// Submit proof to ZK Verify relayer for verification
export async function submitProofToZKVerify(
  proofPayload: ZKVerifyProofPayload
): Promise<ZKVerifySubmissionResult> {
  try {
    const response = await axios.post(
      `${config.zkVerify.relayerUrl}/api/v1/proofs/submit`,
      {
        proof: proofPayload.proof,
        public_inputs: proofPayload.publicInputs,
        proof_type: proofPayload.proofType,
        metadata: proofPayload.metadata
      },
      {
        headers: {
          'Authorization': `Bearer ${config.zkVerify.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    )

    if (response.data.success) {
      return {
        success: true,
        proofHash: response.data.proof_hash,
        transactionId: response.data.transaction_id
      }
    } else {
      return {
        success: false,
        proofHash: '',
        error: response.data.error || 'Unknown error from ZK Verify'
      }
    }

  } catch (error) {
    console.error('Error submitting proof to ZK Verify:', error)
    
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        proofHash: '',
        error: `ZK Verify API error: ${error.response?.data?.message || error.message}`
      }
    }
    
    return {
      success: false,
      proofHash: '',
      error: 'Failed to submit proof to ZK Verify'
    }
  }
}

// Check proof verification status
export async function checkProofStatus(proofHash: string): Promise<ZKVerifyProofStatus> {
  try {
    const response = await axios.get(
      `${config.zkVerify.relayerUrl}/api/v1/proofs/${proofHash}/status`,
      {
        headers: {
          'Authorization': `Bearer ${config.zkVerify.apiKey}`
        },
        timeout: 10000
      }
    )

    return {
      status: response.data.status,
      proofHash: response.data.proof_hash,
      transactionId: response.data.transaction_id,
      verificationTime: response.data.verification_time,
      error: response.data.error
    }

  } catch (error) {
    console.error('Error checking proof status:', error)
    
    return {
      status: 'failed',
      proofHash,
      error: 'Failed to check proof status'
    }
  }
}

// Get Semaphore vkHash from config
export function getSemaphoreVkHash(depth?: number): string {
  if (depth !== undefined) {
    const mapped = config.semaphore.vkHashes[depth]
    if (mapped) {
      return mapped
    }
  }

  if (config.semaphore.defaultVkHash) {
    return config.semaphore.defaultVkHash
  }

  throw new Error(`No Semaphore vkHash configured for depth ${depth ?? 'unknown'}`)
}

// Submit Semaphore proof for group joining
export async function submitGroupJoinProof(
  semaphoreProof: SemaphoreProofData,
  groupId: string,
  zkEmailProofHash: string
): Promise<ZKVerifySubmissionResult> {
  try {
    const vkHash = getSemaphoreVkHash(semaphoreProof.merkleTreeDepth)
    const publicSignals = normalizePublicSignals(semaphoreProof.publicSignals)

    const submitParams: Record<string, unknown> = {
      proofType: 'groth16',
      vkRegistered: true,
      proofOptions: { library: 'snarkjs', curve: 'bn128' },
      proofData: {
        proof: semaphoreProof.proof,
        publicSignals,
        vk: vkHash
      }
    }

    // Note: chainId is intentionally NOT included to avoid aggregation
    // When chainId is omitted, zkVerify will finalize the proof directly without aggregation

    const response = await fetch(
      `${config.zkVerify.relayerUrl}/submit-proof/${config.zkVerify.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitParams)
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to submit Semaphore proof: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.optimisticVerify !== 'success') {
      return {
        success: false,
        proofHash: '',
        error: 'Semaphore proof optimistic verification failed'
      }
    }

    return {
      success: true,
      proofHash: `semaphore_${data.jobId}`,
      jobId: data.jobId,
      transactionId: data.jobId
    }

  } catch (error) {
    console.error('Error submitting Semaphore proof:', error)
    return {
      success: false,
      proofHash: '',
      error: error instanceof Error ? error.message : 'Failed to submit Semaphore proof'
    }
  }
}

// Submit Semaphore proof for posting (same as voting)
export async function submitPostProof(
  semaphoreProof: SemaphoreProofData
): Promise<ZKVerifySubmissionResult> {
  try {
    const vkHash = getSemaphoreVkHash(semaphoreProof.merkleTreeDepth)
    const publicSignals = normalizePublicSignals(semaphoreProof.publicSignals)

    const submitParams: Record<string, unknown> = {
      proofType: 'groth16',
      vkRegistered: true,
      proofOptions: { library: 'snarkjs', curve: 'bn128' },
      proofData: {
        proof: semaphoreProof.proof,
        publicSignals,
        vk: vkHash
      }
    }

    // Note: chainId is intentionally NOT included to avoid aggregation
    // When chainId is omitted, zkVerify will finalize the proof directly without aggregation

    console.log('Submitting Semaphore post proof:', {
      vkHash,
      merkleTreeDepth: semaphoreProof.merkleTreeDepth,
      proofData: {
        proof: semaphoreProof.proof,
        publicSignals
      }
    })

    const response = await fetch(
      `${config.zkVerify.relayerUrl}/submit-proof/${config.zkVerify.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitParams)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ZK Verify submission failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to submit post proof: ${response.status} ${response.statusText}. ${errorText}`)
    }

    const data = await response.json()
    console.log('ZK Verify response:', data)

    if (data.optimisticVerify !== 'success') {
      console.error('ZK Verify optimistic verification failed:', {
        response: data,
        optimisticVerify: data.optimisticVerify,
        error: data.error,
        details: data.details || data.message
      })
      return {
        success: false,
        proofHash: '',
        error: `Post proof optimistic verification failed: ${data.error || data.message || JSON.stringify(data)}`
      }
    }

    return {
      success: true,
      proofHash: `post_${data.jobId}`,
      jobId: data.jobId, // Add raw jobId for polling
      transactionId: data.jobId
    }

  } catch (error) {
    console.error('Error submitting post proof:', error)
    return {
      success: false,
      proofHash: '',
      error: error instanceof Error ? error.message : 'Failed to submit post proof'
    }
  }
}

// Submit Semaphore proof for voting
export async function submitVoteProof(
  semaphoreProof: SemaphoreProofData,
  groupId: string,
  postId: string,
  voteChoice: 'yes' | 'no'
): Promise<ZKVerifySubmissionResult> {
  try {
    const vkHash = getSemaphoreVkHash(semaphoreProof.merkleTreeDepth)
    const publicSignals = normalizePublicSignals(semaphoreProof.publicSignals)

    const submitParams: Record<string, unknown> = {
      proofType: 'groth16',
      vkRegistered: true,
      proofOptions: { library: 'snarkjs', curve: 'bn128' },
      proofData: {
        proof: semaphoreProof.proof,
        publicSignals,
        vk: vkHash // pass the hash, not the whole vkey
      }
    }

    // Note: chainId is intentionally NOT included to avoid aggregation
    // When chainId is omitted, zkVerify will finalize the proof directly without aggregation

    console.log('Submitting Semaphore vote proof:', {
      vkHash,
      merkleTreeDepth: semaphoreProof.merkleTreeDepth,
      proofData: {
        proof: semaphoreProof.proof,
        publicSignals
      }
    })

    const response = await fetch(
      `${config.zkVerify.relayerUrl}/submit-proof/${config.zkVerify.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitParams)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ZK Verify vote submission failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to submit vote proof: ${response.status} ${response.statusText}. ${errorText}`)
    }

    const data = await response.json()
    console.log('ZK Verify vote response:', data)

    if (data.optimisticVerify !== 'success') {
      return {
        success: false,
        proofHash: '',
        error: `Vote proof optimistic verification failed: ${data.error || 'Unknown error'}`
      }
    }

    return {
      success: true,
      proofHash: `vote_${data.jobId}`,
      jobId: data.jobId, // Add raw jobId for polling
      transactionId: data.jobId
    }

  } catch (error) {
    console.error('Error submitting vote proof:', error)
    return {
      success: false,
      proofHash: '',
      error: error instanceof Error ? error.message : 'Failed to submit vote proof'
    }
  }
}

// Note: ZK Email proofs are now handled directly in zk-email.ts
// This function is kept for backward compatibility but should not be used
export async function submitZKEmailProof(
  emailProofHash: string,
  blueprintId: string,
  groupId: string
): Promise<ZKVerifySubmissionResult> {
  // ZK Email proofs are now submitted directly via the ZK Email SDK
  // This is a placeholder for backward compatibility
  return {
    success: true,
    proofHash: emailProofHash,
    transactionId: `legacy_${Date.now()}`
  }
}

// Batch verify multiple proofs (useful for checking group membership proofs)
export async function batchVerifyProofs(proofHashes: string[]): Promise<{
  [proofHash: string]: ZKVerifyProofStatus
}> {
  try {
    const response = await axios.post(
      `${config.zkVerify.relayerUrl}/api/v1/proofs/batch-status`,
      {
        proof_hashes: proofHashes
      },
      {
        headers: {
          'Authorization': `Bearer ${config.zkVerify.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    )

    return response.data.results || {}

  } catch (error) {
    console.error('Error batch verifying proofs:', error)
    
    // Return failed status for all proofs
    const results: { [proofHash: string]: ZKVerifyProofStatus } = {}
    for (const hash of proofHashes) {
      results[hash] = {
        status: 'failed',
        proofHash: hash,
        error: 'Batch verification failed'
      }
    }
    return results
  }
}

// Helper function to wait for proof verification using ZK Verify job status
export async function waitForProofVerification(
  jobId: string,
  options: {
    maxAttempts?: number
    intervalMs?: number
  } = {}
): Promise<{ success: boolean; status: string; data?: any; error?: string }> {
  const {
    maxAttempts = 60,
    intervalMs = 5000,
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
      
      console.log(`ZK Verify job status: ${status}`)
      
      // Check for completion statuses (only Finalized, no aggregation)
      if (status === 'Finalized') {
        return {
          success: true,
          status,
          data: statusData
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
