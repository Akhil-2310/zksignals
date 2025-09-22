import { Identity, Group } from '@semaphore-protocol/core'
import { generateProof } from '@semaphore-protocol/proof'
import { unpackGroth16Proof } from '@zk-kit/utils'
import { keccak256, toBeHex } from 'ethers'
import { encodeBytes32String } from 'ethers/abi'
import type { NumericString } from "snarkjs"
import type { BigNumberish } from 'ethers'
import { getCurrentAnonymousUser } from './auth'

export interface SemaphoreIdentityData {
  identity: Identity
  commitment: string
  encryptedSecret: string
}

export interface SemaphoreProofData {
  proof: {
    pi_a: string[]
    pi_b: string[][]
    pi_c: string[]
  }
  publicSignals: string[]
  merkleTreeRoot: string
  nullifier: string
  signalHash: string
  externalNullifier: string
}

export type SemProofBundle = {
  proofSnarkjs: any              // {pi_a, pi_b, pi_c}
  merkleTreeRoot: string
  nullifier: string
  signalHash: string             // hashed message used for proving
  externalNullifier: string      // hashed scope used for proving
  publicSignals: string[]        // for backward compatibility
}

// Hash function for Semaphore (matches the circuit)
export function hash(message: BigNumberish | string): NumericString {
  let messageToHash: BigNumberish
  
  // If message is a string, hash it first to get a fixed-size value
  if (typeof message === 'string') {
    // Convert string to bytes using UTF-8 encoding
    const encoder = new TextEncoder()
    const bytes = encoder.encode(message)
    
    // Hash the bytes to get a fixed-size hex string (32 bytes)
    const hashedHex = keccak256(bytes)
    messageToHash = BigInt(hashedHex)
  } else {
    messageToHash = message
  }
  
  const bigIntValue = BigInt(keccak256(toBeHex(messageToHash, 32))) >> BigInt(8)
  return bigIntValue.toString()
}

// String-specific hash function (following the guidance)
export function hashToFieldStr(s: string): string {
  // Optional normalization: s = s.normalize('NFKC');
  const encoder = new TextEncoder()
  const bytes = encoder.encode(s)
  return (BigInt(keccak256(bytes)) >> BigInt(8)).toString()
}

// Number-specific hash function (following the guidance)
export function hashToFieldNum(x: BigNumberish): string {
  return (BigInt(keccak256(toBeHex(x, 32))) >> BigInt(8)).toString()
}

// Normalize strings for consistent hashing
const normalize = (s: string) =>
  s.normalize("NFKC").replace(/\r\n/g, "\n").trim()

// Deterministic Semaphore proof generation (following your guidance)
export async function generateSemaphoreProofDeterministic(
  identity: Identity,
  group: Group,
  message: string | BigNumberish,
  scope: string | BigNumberish
): Promise<SemProofBundle> {
  // Normalize & hash deterministically
  const signalHash =
    typeof message === "string" ? hashToFieldStr(normalize(message)) : hashToFieldNum(message)
  const externalNullifier =
    typeof scope === "string" ? hashToFieldStr(normalize(scope)) : hashToFieldNum(scope)

  console.log('Generating deterministic proof with hashes:', {
    message: typeof message === "string" ? normalize(message) : message,
    scope: typeof scope === "string" ? normalize(scope) : scope,
    signalHash,
    externalNullifier
  })

  // Prove using the *raw values* - generateProof handles hashing internally
  const semaProof = await generateProof(identity, group, message, scope)

  const publicSignals = [
    semaProof.merkleTreeRoot.toString(),
    semaProof.nullifier.toString(),
    signalHash,
    externalNullifier,
  ]

  return {
    proofSnarkjs: unpackGroth16Proof(semaProof.points),
    merkleTreeRoot: semaProof.merkleTreeRoot.toString(),
    nullifier: semaProof.nullifier.toString(),
    signalHash,
    externalNullifier,
    publicSignals
  }
}

// Generate or retrieve Semaphore identity for current user
export function generateSemaphoreIdentity(): SemaphoreIdentityData {
  const user = getCurrentAnonymousUser()
  
  // Create deterministic identity based on user's anonymous ID
  // This ensures the same user always gets the same identity
  const encoder = new TextEncoder()
  const userIdBytes = encoder.encode(user.anonymousId)
  const identitySecret = keccak256(userIdBytes)
  const identity = new Identity(identitySecret)
  const commitment = identity.commitment.toString()
  
  // Encrypt the identity secret with user's anonymous ID as key
  const encryptedSecret = encryptIdentitySecret(identity.toString(), user.anonymousId)
  
  return {
    identity,
    commitment,
    encryptedSecret
  }
}

// Restore Semaphore identity from encrypted secret
export function restoreSemaphoreIdentity(encryptedSecret: string, userAnonymousId: string): Identity {
  const identityString = decryptIdentitySecret(encryptedSecret, userAnonymousId)
  return new Identity(identityString)
}

// Create a new Semaphore group with specified depth (default 20 for Semaphore circuits)
export function createSemaphoreGroup(): Group {
  return new Group()
}

// Add member to Semaphore group
export function addMemberToGroup(group: Group, identityCommitment: string): Group {
  group.addMember(identityCommitment)
  return group
}

// Generate Semaphore proof for anonymous action
export async function generateSemaphoreProof(
  identity: Identity,
  group: Group,
  message: string | number | BigNumberish,
  scope: string | BigNumberish
): Promise<SemaphoreProofData> {
  try {
    console.log('Generating Semaphore proof with:', {
      message,
      scope,
      groupSize: group.size,
      groupRoot: group.root.toString(),
      identityCommitment: identity.commitment.toString()
    })
    
    // V4 approach: Pass raw values to generateProof, it handles encoding internally
    console.log('V4 proof generation with raw values:', {
      message,
      scope,
      messageType: typeof message,
      scopeType: typeof scope
    })
    
    // Generate the proof using RAW values (V4 handles encoding internally)
    const semaProof = await generateProof(identity, group, message, scope)
    
    // For publicSignals, compute what V4 computed internally
    // V4 uses encodeBytes32String for strings (like your toBigInt function)
    const signalHash = typeof message === "string" ? 
      (BigInt(keccak256(encodeBytes32String(message))) >> BigInt(8)).toString() :
      hashToFieldNum(message)
    const externalNullifier = typeof scope === "string" ? 
      (BigInt(keccak256(encodeBytes32String(scope))) >> BigInt(8)).toString() :
      hashToFieldNum(scope)
      
    console.log('Computed hashes for publicSignals:', {
      signalHash,
      externalNullifier
    })
    
    console.log('Raw Semaphore proof:', {
      merkleTreeRoot: semaProof.merkleTreeRoot.toString(),
      nullifier: semaProof.nullifier.toString(),
      points: semaProof.points
    })
    
    // Convert to snarkjs proof format
    const snarkjsProof = unpackGroth16Proof(semaProof.points)
    
    // Build public signals in ZK Verify expected order: [merkleRoot, nullifier, hash(message), hash(scope)]
    const publicSignals = [
      semaProof.merkleTreeRoot.toString(),
      semaProof.nullifier.toString(), // This is the nullifier hash
      signalHash, // Hash of the message using working hash function
      externalNullifier // Hash of the scope using working hash function
    ]
    
    console.log('Final proof data:', {
      proof: snarkjsProof,
      publicSignals,
      publicSignalsAsStrings: publicSignals.map(s => s.toString())
    })
    
    return {
      proof: snarkjsProof,
      publicSignals,
      merkleTreeRoot: semaProof.merkleTreeRoot.toString(),
      nullifier: semaProof.nullifier.toString(),
      signalHash,
      externalNullifier
    }
  } catch (error) {
    console.error('Error generating Semaphore proof:', error)
    throw new Error('Failed to generate Semaphore proof')
  }
}

// Get Semaphore identity from local storage
export function getSemaphoreIdentityFromStorage(): SemaphoreIdentityData | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem('anonsignals_semaphore_identity')
  if (!stored) return null
  
  try {
    const data = JSON.parse(stored)
    const user = getCurrentAnonymousUser()
    const identity = restoreSemaphoreIdentity(data.encryptedSecret, user.anonymousId)
    
    // Verify that the restored identity's commitment matches the stored commitment
    const calculatedCommitment = identity.commitment.toString()
    if (calculatedCommitment !== data.commitment) {
      console.warn('Identity commitment mismatch:', {
        stored: data.commitment,
        calculated: calculatedCommitment,
        userAnonymousId: user.anonymousId
      })
      
      // Try to regenerate deterministic identity to see if it matches stored commitment
      const deterministicIdentity = createDeterministicIdentity(user.anonymousId)
      if (deterministicIdentity.commitment === data.commitment) {
        console.log('Using deterministic identity that matches stored commitment')
        // Update local storage with the correct deterministic identity
        storeSemaphoreIdentity(deterministicIdentity)
        return deterministicIdentity
      }
      
      // If still no match, clear invalid identity and force regeneration
      console.warn('Deterministic identity also does not match stored commitment, clearing storage')
      localStorage.removeItem('anonsignals_semaphore_identity')
      return null
    }
    
    return {
      identity,
      commitment: data.commitment, // Always use the stored commitment
      encryptedSecret: data.encryptedSecret
    }
  } catch (error) {
    console.error('Error retrieving Semaphore identity from storage:', error)
    return null
  }
}

// Store Semaphore identity in local storage
export function storeSemaphoreIdentity(identityData: SemaphoreIdentityData): void {
  if (typeof window === 'undefined') return
  
  const storageData = {
    commitment: identityData.commitment,
    encryptedSecret: identityData.encryptedSecret
  }
  
  localStorage.setItem('anonsignals_semaphore_identity', JSON.stringify(storageData))
}

// Get or create Semaphore identity for current user
export function getOrCreateSemaphoreIdentity(): SemaphoreIdentityData {
  // Try to get from local storage first
  const existingIdentity = getSemaphoreIdentityFromStorage()
  if (existingIdentity) {
    return existingIdentity
  }
  
  // Generate deterministic identity
  const newIdentity = generateSemaphoreIdentity()
  storeSemaphoreIdentity(newIdentity)
  
  return newIdentity
}

// Create deterministic identity directly from user ID (for recovery/consistency)
export function createDeterministicIdentity(userAnonymousId: string): SemaphoreIdentityData {
  // Create deterministic identity based on user's anonymous ID
  const encoder = new TextEncoder()
  const userIdBytes = encoder.encode(userAnonymousId)
  const identitySecret = keccak256(userIdBytes)
  const identity = new Identity(identitySecret)
  const commitment = identity.commitment.toString()
  
  // Encrypt the identity secret with user's anonymous ID as key
  const encryptedSecret = encryptIdentitySecret(identity.toString(), userAnonymousId)
  
  return {
    identity,
    commitment,
    encryptedSecret
  }
}

// Simple encryption/decryption functions (in production, use more robust encryption)
function encryptIdentitySecret(secret: string, key: string): string {
  // This is a simple XOR encryption - in production, use proper encryption like AES
  const keyBytes = new TextEncoder().encode(key)
  const secretBytes = new TextEncoder().encode(secret)
  const encrypted = new Uint8Array(secretBytes.length)
  
  for (let i = 0; i < secretBytes.length; i++) {
    encrypted[i] = secretBytes[i] ^ keyBytes[i % keyBytes.length]
  }
  
  return btoa(String.fromCharCode(...encrypted))
}

function decryptIdentitySecret(encryptedSecret: string, key: string): string {
  // Reverse of the encryption process
  const keyBytes = new TextEncoder().encode(key)
  const encryptedBytes = new Uint8Array(atob(encryptedSecret).split('').map(c => c.charCodeAt(0)))
  const decrypted = new Uint8Array(encryptedBytes.length)
  
  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length]
  }
  
  return new TextDecoder().decode(decrypted)
}

// Serialize group for storage (handles BigInt values)
export function serializeGroup(group: Group): string {
  const serializable = {
    members: group.members.map(member => member.toString()), // Convert BigInt to string
    merkleTree: {
      depth: group.depth,
      size: group.size,
      root: group.root.toString() // Convert BigInt to string
    }
  }
  
  return JSON.stringify(serializable)
}

// Deserialize group from storage
export function deserializeGroup(serializedGroup: string): Group {
  const data = JSON.parse(serializedGroup)
  const group = new Group()
  
  // Add all members to recreate the group
  for (const member of data.members) {
    group.addMember(member) // Members are already strings, Group will handle conversion
  }
  
  return group
}
