import { BN, compactFromU8a } from "./../polkadot"
import { Hex } from "./../../utils"
import { Decodable } from "./../../interface"
import ClientError from "./../../error"

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

export class Decoder {
  public internalArray: Uint8Array
  public offset: number = 0
  constructor(array: Uint8Array, offset?: number) {
    this.internalArray = array
    this.offset = offset ?? 0
  }

  static fromHex(value: string, offset?: number): Decoder | ClientError {
    const array = Hex.decode(value)
    if (array instanceof ClientError) return array

    return new Decoder(array, offset)
  }

  static fromHexUnsafe(value: string, offset?: number): Decoder {
    const decoder = this.fromHex(value, offset)
    if (decoder instanceof ClientError) throw decoder

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
    if (bytes instanceof ClientError) {
      // Should never happen
      return new Uint8Array()
    }

    return bytes
  }

  hasAtLeast(count: number): boolean {
    return this.remainingLen() >= count
  }

  any<T>(T: Decodable<T>): T | ClientError {
    const decoded = T.decode(this)
    if (decoded instanceof ClientError) return decoded

    return decoded
  }

  option<T>(T: Decodable<T>): T | null | ClientError {
    const variant = this.u8()
    if (variant instanceof ClientError) return variant
    if (variant == 0) return null

    if (variant == 1) {
      const decoded = T.decode(this)
      if (decoded instanceof ClientError) return decoded

      return decoded
    }

    return new ClientError("Failed to decode Option<T>")
  }

  // result<S, F>(S: Decodable<S>, F: Decodable<F>): [S | null, F | null] | ClientError {
  //   const success = this.u8()
  //   if (success instanceof ClientError) return success
  //   if (!success) {
  //     const fail = F.decode(this)
  //     if (fail instanceof ClientError) return fail
  //     return [null, fail]
  //   }

  //   const suc = S.decode(this)
  //   if (suc instanceof ClientError) return suc
  //   return [suc, null]
  // }

  bool(): boolean | ClientError {
    const byte = this.u8()
    if (byte instanceof ClientError) return byte
    if (byte == 0) return false
    if (byte == 1) return true

    return new ClientError("Invalid boolean value.")
  }

  u8(compact?: boolean): number | ClientError {
    if (compact === true) {
      const result = this.compact()
      if (result instanceof ClientError) return result

      return result.toNumber()
    }

    if (!this.hasAtLeast(1)) {
      return new ClientError("Not enough bytes to decode u8")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 1)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 1
    return value.toNumber()
  }

  u16(compact?: boolean): number | ClientError {
    if (compact === true) {
      const result = this.compact()
      if (result instanceof ClientError) return result

      return result.toNumber()
    }

    if (!this.hasAtLeast(2)) {
      return new ClientError("Not enough bytes to decode u16")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 2)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 2
    return value.toNumber()
  }

  u32(compact?: boolean): number | ClientError {
    if (compact === true) {
      const result = this.compact()
      if (result instanceof ClientError) return result

      return result.toNumber()
    }

    if (!this.hasAtLeast(4)) {
      return new ClientError("Not enough bytes to decode u32")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 4)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 4
    return value.toNumber()
  }

  u64(compact?: boolean): BN | ClientError {
    if (compact === true) {
      return this.compact()
    }

    if (!this.hasAtLeast(8)) {
      return new ClientError("Not enough bytes to decode u64")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 8)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 8
    return value
  }

  u128(compact?: boolean): BN | ClientError {
    if (compact === true) {
      return this.compact()
    }

    if (!this.hasAtLeast(16)) {
      return new ClientError("Not enough bytes to decode u128")
    }

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 16)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 16
    return value
  }

  compact(): BN | ClientError {
    try {
      const [offset, value] = compactFromU8a(this.internalArray.slice(this.offset))
      this.offset += offset

      if (offset == 0) {
        return new ClientError("Failed to decode compat value")
      }

      return value
    } catch (e: any) {
      return new ClientError(e.toString())
    }
  }

  // Dynamic Array (Has length Prefix)
  vec<T>(T: Decodable<T>): T[] | ClientError {
    const length = this.u32(true)
    if (length instanceof ClientError) return length

    if (length == 0) {
      return []
    }

    const array = []
    for (let i = 0; i < length; ++i) {
      const decoded = T.decode(this)
      if (decoded instanceof ClientError) return decoded

      array.push(decoded)
    }

    return array
  }

  // Dynamic Array (Has length Prefix)
  vecU8(): Uint8Array | ClientError {
    // Read Compact length
    const result = this.compact()
    if (result instanceof ClientError) return result

    const length = result.toNumber()
    if (length == 0) {
      return new Uint8Array()
    }

    const value = this.internalArray.slice(this.offset, this.offset + length)
    this.offset += length
    return value
  }

  // Fixed Array (Does not have length Prefix)
  array(count: number): Uint8Array | ClientError {
    return this.bytes(count)
  }

  // Fixed Array (Does not have length Prefix)
  bytes(count: number): Uint8Array | ClientError {
    if (!this.hasAtLeast(count)) return new ClientError("Not enough bytes to decode bytes")

    const value = this.internalArray.slice(this.offset, this.offset + count)
    this.offset += count
    return value
  }

  byte(): number | ClientError {
    return this.u8()
  }

  peek(count: number): Uint8Array | ClientError {
    if (!this.hasAtLeast(count)) {
      return new ClientError("Not enough bytes to decode bytes")
    }

    const value = this.internalArray.slice(this.offset, this.offset + count)
    return value
  }

  peekUnsafe(count: number): Uint8Array {
    const value = this.internalArray.slice(this.offset, this.offset + count)
    return value
  }
}
