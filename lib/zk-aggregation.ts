// Utility functions for ZK proof handling
// Note: Aggregation functionality has been removed. 
// This file now only contains utility functions used by other modules.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
