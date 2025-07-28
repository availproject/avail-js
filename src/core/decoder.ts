import { BN, GeneralError } from "./."
import { compactFromU8a } from "@polkadot/util"
import { Decodable } from "./decode_transaction"
import { Hex } from "./utils"

/* export enum Hasher {
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
} */

export default class Decoder {
  public internalArray: Uint8Array
  public offset: number = 0
  constructor(array: Uint8Array, offset?: number) {
    this.internalArray = array
    this.offset = offset ?? 0
  }

  public static fromHex(value: string, offset?: number): Decoder | GeneralError {
    const array = Hex.decode(value)
    if (array instanceof GeneralError) return array

    return new Decoder(array, offset)
  }

  public static fromHexUnsafe(value: string, offset?: number): Decoder {
    const decoder = this.fromHex(value, offset)
    if (decoder instanceof GeneralError) throw Error(decoder.value)

    return decoder
  }

  len(): number {
    return this.internalArray.length
  }

  remainingLen(): number {
    return this.internalArray.length - this.offset
  }

  remainingBytes(): Uint8Array {
    const length = this.remainingLen()
    if (length == 0) {
      return new Uint8Array()
    }

    const bytes = this.bytes(length)
    if (bytes instanceof GeneralError) {
      // Should never happen
      return new Uint8Array()
    }

    return bytes
  }

  hasAtLeast(count: number): boolean {
    return this.remainingLen() >= count
  }

  any<T>(T: Decodable<T>): T | GeneralError {
    const decoded = T.decode(this)
    if (decoded instanceof GeneralError) return decoded

    return decoded
  }

  option<T>(T: Decodable<T>): T | null | GeneralError {
    const variant = this.u8()
    if (variant instanceof GeneralError) return variant

    if (variant == 0) {
      return null
    }

    if (variant == 1) {
      const decoded = T.decode(this)
      if (decoded instanceof GeneralError) return decoded

      return decoded
    }

    return new GeneralError("Failed to decode Option<T>")
  }

  bool(): boolean | GeneralError {
    const byte = this.u8()
    if (byte instanceof GeneralError) return byte
    if (byte == 0) {
      return false
    }
    if (byte == 1) {
      return true
    }
    return new GeneralError("Invalid boolean value.")
  }

  u8(compact?: boolean): number | GeneralError {
    if (compact === true) {
      const result = this.compact()
      if (result instanceof GeneralError) return result

      return result.toNumber()
    }

    if (!this.hasAtLeast(1)) {
      return new GeneralError("Not enough bytes to decode u8")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 1)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 1
    return value.toNumber()
  }

  u16(compact?: boolean): number | GeneralError {
    if (compact === true) {
      const result = this.compact()
      if (result instanceof GeneralError) return result

      return result.toNumber()
    }

    if (!this.hasAtLeast(2)) {
      return new GeneralError("Not enough bytes to decode u16")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 2)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 2
    return value.toNumber()
  }

  u32(compact?: boolean): number | GeneralError {
    if (compact === true) {
      const result = this.compact()
      if (result instanceof GeneralError) return result

      return result.toNumber()
    }

    if (!this.hasAtLeast(4)) {
      return new GeneralError("Not enough bytes to decode u32")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 4)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 4
    return value.toNumber()
  }

  u64(compact?: boolean): BN | GeneralError {
    if (compact === true) {
      return this.compact()
    }

    if (!this.hasAtLeast(8)) {
      return new GeneralError("Not enough bytes to decode u64")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 8)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 8
    return value
  }

  u128(compact?: boolean): BN | GeneralError {
    if (compact === true) {
      return this.compact()
    }

    if (!this.hasAtLeast(16)) {
      return new GeneralError("Not enough bytes to decode u128")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 16)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 16
    return value
  }

  compact(): BN | GeneralError {
    try {
      const [offset, value] = compactFromU8a(this.internalArray.slice(this.offset))
      this.offset += offset

      if (offset == 0) {
        return new GeneralError("Failed to decode compat value")
      }

      return value
    } catch (e: any) {
      return new GeneralError(e.toString())
    }
  }

  // Dynamic Array (Has length Prefix)
  vec<T>(T: Decodable<T>): T[] | GeneralError {
    const length = this.u32(true)
    if (length instanceof GeneralError) return length

    if (length == 0) {
      return []
    }

    const array = []
    for (let i = 0; i < length; ++i) {
      const decoded = T.decode(this)
      if (decoded instanceof GeneralError) return decoded

      array.push(decoded)
    }

    return array
  }

  // Dynamic Array (Has length Prefix)
  vecU8(): Uint8Array | GeneralError {
    // Read Compact length
    const result = this.compact()
    if (result instanceof GeneralError) return result

    const length = result.toNumber()
    if (length == 0) {
      return new Uint8Array()
    }

    const value = this.internalArray.slice(this.offset, this.offset + length)
    this.offset += length
    return value
  }

  // Fixed Array (Does not have length Prefix)
  array(count: number): Uint8Array | GeneralError {
    return this.bytes(count)
  }

  // Fixed Array (Does not have length Prefix)
  bytes(count: number): Uint8Array | GeneralError {
    if (!this.hasAtLeast(count)) {
      return new GeneralError("Not enough bytes to decode bytes")
    }

    const value = this.internalArray.slice(this.offset, this.offset + count)
    this.offset += count
    return value
  }

  byte(): number | GeneralError {
    return this.u8()
  }

  peek(count: number): Uint8Array | GeneralError {
    if (!this.hasAtLeast(count)) {
      return new GeneralError("Not enough bytes to decode bytes")
    }

    const value = this.internalArray.slice(this.offset, this.offset + count)
    return value
  }
}
