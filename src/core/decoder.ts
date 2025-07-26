import { BN } from "./."
import { compactFromU8a, hexToU8a } from "@polkadot/util"
import { Decodable } from "./decode_transaction"

export enum Hasher {
  BLAKE2_128_CONCAT = 0,
  TWOX64_CONCAT = 1,
}

export function decodeBlake2_128Concat(input: ArrayBuffer): ArrayBuffer {
  // Blake2_128Concat keys are in the format:
  // [16-byte Blake2_128 hash | original key bytes]
  if (input.byteLength <= 16) {
    throw new Error("Invalid Blake2_128Concat key format")
  }
  return input.slice(16) // Return the original key bytes
}

export function decodeTwox64Concat(input: ArrayBuffer): ArrayBuffer {
  // Twox64Concat keys are in the format:
  // [8-byte Twox64Concat | original key bytes]
  if (input.byteLength <= 8) {
    throw new Error("Invalid Twox64Concat key format")
  }

  return input.slice(8)
}

export function partiallyDecodeKey(input: ArrayBuffer, hasher: Hasher): Uint8Array {
  if (hasher == Hasher.BLAKE2_128_CONCAT) {
    return new Uint8Array(decodeBlake2_128Concat(input.slice(32)))
  } else if (hasher == Hasher.TWOX64_CONCAT) {
    return new Uint8Array(decodeTwox64Concat(input.slice(32)))
  }

  throw new Error("Unknown Hasher")
}

export default class Decoder {
  public internalArray: Uint8Array
  public offset: number = 0
  constructor(array: Uint8Array, offset?: number) {
    this.internalArray = array
    this.offset = offset ?? 0
  }

  public static fromHex(value: string, offset?: number): Decoder {
    const array = hexToU8a(value)
    return new Decoder(array, offset)
  }

  len(): number {
    return this.internalArray.length
  }

  remainingLen(): number {
    return this.internalArray.length - this.offset
  }

  hasAtLeast(count: number): boolean {
    return this.remainingLen() >= count
  }

  readByte(): number {
    return this.u8()
  }

  any<T>(T: Decodable<T>): T {
    const decoded = T.decode(this)
    if (decoded == null) {
      throw Error("Failed to decoded type")
    }
    return decoded
  }

  u8(compact?: boolean): number {
    if (compact === true) {
      return this.compact().toNumber()
    }

    if (!this.hasAtLeast(1)) {
      throw new Error("Not enough bytes to decode u8")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 1)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 1
    return value.toNumber()
  }

  u16(compact?: boolean): number {
    if (compact === true) {
      return this.compact().toNumber()
    }

    if (!this.hasAtLeast(2)) {
      throw new Error("Not enough bytes to decode u16")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 2)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 2
    return value.toNumber()
  }

  u32(compact?: boolean): number {
    if (compact === true) {
      return this.compact().toNumber()
    }

    if (!this.hasAtLeast(4)) {
      throw new Error("Not enough bytes to decode u32")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 4)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 4
    return value.toNumber()
  }

  u64(compact?: boolean): BN {
    if (compact === true) {
      return this.compact()
    }

    if (!this.hasAtLeast(8)) {
      throw new Error("Not enough bytes to decode u64")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 8)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 8
    return value
  }

  u128(compact?: boolean): BN {
    if (compact === true) {
      return this.compact()
    }

    if (!this.hasAtLeast(16)) {
      throw new Error("Not enough bytes to decode u128")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 16)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 16
    return value
  }

  compact(): BN {
    const [offset, value] = compactFromU8a(this.internalArray.slice(this.offset))
    this.offset += offset

    return value
  }

  // Dynamic Array like Vec
  array<T>(T: Decodable<T>): T[] {
    const length = this.u32(true)
    if (length == 0) {
      return []
    }

    const array = []
    for (let i = 0; i < length; ++i) {
      const decoded = T.decode(this)
      if (decoded == null) {
        throw Error("Failed to scale decoded type.")
      }
      array.push(decoded)
    }

    return array
  }

  // Dynamic Array like Vec
  arrayU8(): Uint8Array {
    // Read Compact length
    const length = this.compact().toNumber()
    if (length == 0) {
      return new Uint8Array()
    }

    const value = this.internalArray.slice(this.offset, this.offset + length)
    this.offset += length
    return value
  }

  // Fixed Array
  bytes(count: number): Uint8Array {
    if (!this.hasAtLeast(count)) {
      throw new Error("Not enough bytes to decode bytes")
    }

    const value = this.internalArray.slice(this.offset, this.offset + count)
    this.offset += count
    return value
  }

  peek(count: number): Uint8Array {
    if (!this.hasAtLeast(count)) {
      throw new Error("Not enough bytes to decode bytes")
    }

    const value = this.internalArray.slice(this.offset, this.offset + count)
    return value
  }
}
