import { Contract, keccak256, sha256, solidityPackedKeccak256, toUtf8Bytes } from 'ethers'
import type { BigNumberish, ContractRunner } from 'ethers'

import { config } from './config'

export interface AggregationArtifacts {
  aggregationId?: string
  domainId?: string
  leaf: string
  merklePath: string[]
  leafCount?: string
  index?: string
  treeDepth?: number
  computedLeaf?: string
  leafMatches?: boolean
  onChainVerified?: boolean
  onChainVerificationError?: string
}

export interface VerifyProofAggregationParams {
  runner: ContractRunner
  aggregationId: BigNumberish
  domainId: BigNumberish
  leaf: string
  merklePath: readonly string[]
  leafCount: BigNumberish
  index: BigNumberish
  contractAddress?: string
  treeDepth?: number
}

const PROVING_SYSTEM_ID_HASH = keccak256(toUtf8Bytes('groth16'))
const VERSION_HASH = sha256('0x')

function toBigInt(value: BigNumberish | string): bigint {
  if (typeof value === 'bigint') {
    return value
  }
  if (typeof value === 'number') {
    return BigInt(value)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      throw new Error('Cannot convert empty string to bigint')
    }
    return BigInt(trimmed.startsWith('0x') ? trimmed : trimmed)
  }
  if (value && typeof (value as any).toString === 'function') {
    const converted = (value as any).toString()
    if (!converted) {
      throw new Error('Cannot convert value to bigint')
    }
    return BigInt(converted.startsWith('0x') ? converted : converted)
  }
  throw new Error('Unsupported BigNumberish value')
}

function toBytes32(value: BigNumberish | string): string {
  const big = toBigInt(value)
  const hex = big.toString(16)
  if (hex.length > 64) {
    throw new Error('Value exceeds 32 bytes')
  }
  return `0x${hex.padStart(64, '0')}`
}

function normalizeHex(value: string | BigNumberish | undefined | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }
    if (trimmed.startsWith('0x')) {
      return `0x${trimmed.slice(2).padStart(64, '0')}`
    }
    return toBytes32(trimmed)
  }
  return toBytes32(value)
}

function normalizeHexStrict(value: string | BigNumberish): string {
  const normalized = normalizeHex(value)
  if (!normalized) {
    throw new Error('Expected hex value')
  }
  return normalized
}

function reverseBytes32(hexValue: string): string {
  const normalized = normalizeHexStrict(hexValue)
  const hex = normalized.slice(2)
  const bytes = hex.match(/.{2}/g)
  if (!bytes) {
    throw new Error('Invalid bytes32 value')
  }
  return `0x${bytes.reverse().join('')}`
}

function toDecimalString(value: any): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === 'bigint' || typeof value === 'number') {
    return value.toString()
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }
    if (trimmed.startsWith('0x')) {
      return BigInt(trimmed).toString()
    }
    return trimmed
  }
  if (value && typeof value.toString === 'function') {
    const converted = value.toString()
    if (!converted) {
      return undefined
    }
    if (converted.startsWith('0x')) {
      return BigInt(converted).toString()
    }
    return converted
  }
  return undefined
}

function toNumber(value: any): number | undefined {
  const decimalString = toDecimalString(value)
  if (decimalString === undefined) {
    return undefined
  }
  const parsed = Number(decimalString)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function normalizePublicSignals(signals: any[]): string[] {
  return signals.map(signal => {
    if (typeof signal === 'string') {
      const trimmed = signal.trim()
      if (!trimmed) {
        throw new Error('Empty public signal value')
      }
      if (trimmed.startsWith('0x')) {
        return BigInt(trimmed).toString()
      }
      return trimmed
    }
    if (typeof signal === 'bigint' || typeof signal === 'number') {
      return signal.toString()
    }
    if (signal && typeof signal.toString === 'function') {
      return signal.toString()
    }
    throw new Error('Unsupported public signal value')
  })
}

export function extractAggregationArtifacts(
  statusData: any,
  options: { treeDepth?: number } = {}
): AggregationArtifacts | undefined {
  const details = statusData?.aggregationDetails ?? statusData?.aggregation_details
  if (!details) {
    return undefined
  }

  const aggregationId = toDecimalString(statusData?.aggregationId ?? details.aggregationId)
  const domainIdFromStatus = toDecimalString(statusData?.domainId ?? details.domainId)
  const domainId = domainIdFromStatus ?? (
    config.zkVerify.domainId !== undefined ? config.zkVerify.domainId.toString() : undefined
  )
  const leaf = normalizeHex(details.leaf ?? details.leafHash ?? details.hash)
  const leafCount = toDecimalString(details.leafCount ?? details.leaf_count ?? details.totalLeaves)
  const index = toDecimalString(details.index ?? details.leafIndex ?? details.position)
  const merklePathRaw = details.merklePath ?? details.merkle_path ?? []
  const depthRaw = details.treeDepth
    ?? details.merkleDepth
    ?? details.depth
    ?? statusData?.treeDepth
    ?? statusData?.merkleDepth
    ?? options.treeDepth

  let merklePath: string[] = []
  if (Array.isArray(merklePathRaw)) {
    try {
      merklePath = merklePathRaw.map((entry: any) => {
        const normalized = normalizeHex(entry)
        if (!normalized) {
          throw new Error('Invalid merkle path entry')
        }
        return normalized
      })
    } catch {
      return undefined
    }
  }

  const treeDepth = toNumber(depthRaw)

  if (!leaf || merklePath.length === 0 || !aggregationId) {
    return undefined
  }

  return {
    aggregationId,
    domainId,
    leaf,
    merklePath,
    leafCount,
    index,
    treeDepth,
  }
}

export function computeAggregationLeaf(publicSignals: readonly string[], vkHash: string): string {
  if (publicSignals.length !== 4) {
    throw new Error('Semaphore proofs are expected to expose exactly 4 public signals')
  }

  const endianAdjustedSignals = publicSignals.map(signal => reverseBytes32(toBytes32(signal)))
  const inner = solidityPackedKeccak256(
    ['bytes32', 'bytes32', 'bytes32', 'bytes32'],
    endianAdjustedSignals
  )

  return solidityPackedKeccak256(
    ['bytes32', 'bytes32', 'bytes32', 'bytes32'],
    [PROVING_SYSTEM_ID_HASH, normalizeHexStrict(vkHash), VERSION_HASH, inner]
  )
}

export function aggregationArtifactsToParams(aggregation: AggregationArtifacts): Omit<VerifyProofAggregationParams, 'runner'> {
  if (!aggregation.aggregationId) {
    throw new Error('Aggregation ID is missing')
  }
  if (!aggregation.domainId) {
    throw new Error('Domain ID is missing from aggregation metadata')
  }
  if (!aggregation.leafCount) {
    throw new Error('Leaf count is missing from aggregation metadata')
  }
  if (!aggregation.index) {
    throw new Error('Leaf index is missing from aggregation metadata')
  }
  if (!aggregation.leaf || aggregation.merklePath.length === 0) {
    throw new Error('Aggregation metadata is missing Merkle path information')
  }

  return {
    aggregationId: aggregation.aggregationId,
    domainId: aggregation.domainId,
    leaf: aggregation.leaf,
    merklePath: aggregation.merklePath,
    leafCount: aggregation.leafCount,
    index: aggregation.index,
    treeDepth: aggregation.treeDepth,
  }
}

export async function verifyProofAggregationOnChain(params: VerifyProofAggregationParams): Promise<boolean> {
  const {
    runner,
    aggregationId,
    domainId,
    leaf,
    merklePath,
    leafCount,
    index,
    contractAddress,
    treeDepth,
  } = params

  const configuredByDepth =
    typeof treeDepth === 'number'
      ? config.semaphore.aggregatorAddresses[treeDepth]
      : undefined

  const resolvedAddress =
    contractAddress
    || configuredByDepth
    || config.semaphore.defaultAggregatorAddress
    || config.zkVerify.aggregatorAddress

  if (!resolvedAddress) {
    throw new Error('Proof aggregation contract address is not configured')
  }

  const contract = new Contract(resolvedAddress, [
    'function verifyProofAggregation(uint256 _domainId, uint256 _aggregationId, bytes32 _leaf, bytes32[] calldata _merklePath, uint256 _leafCount, uint256 _index) external view returns (bool)'
  ] as const, runner)

  return await contract.verifyProofAggregation(
    toBigInt(domainId),
    toBigInt(aggregationId),
    normalizeHexStrict(leaf),
    merklePath.map(entry => normalizeHexStrict(entry)),
    toBigInt(leafCount),
    toBigInt(index)
  )
}

export type { BigNumberish, ContractRunner } from 'ethers'
