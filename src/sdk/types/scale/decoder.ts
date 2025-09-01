import { BN, compactFromU8a } from "./../polkadot"
import { Hex } from "./../../utils"
import { IDecodable } from "./../../interface"
import { ClientError } from "./../../error"

export class Decoder {
  public internalArray: Uint8Array
  public offset: number = 0
  constructor(array: Uint8Array, offset?: number) {
    this.internalArray = array
    this.offset = offset ?? 0
  }

  static from(value: Decoder | string | Uint8Array, offset?: number): Decoder | ClientError {
    if (typeof value == "string") {
      const decoded = Hex.decode(value)
      if (decoded instanceof ClientError) return decoded
      return new Decoder(decoded, offset)
    } else if ("length" in value) {
      return new Decoder(value, offset)
    }

    return value
  }

  static fromUnsafe(value: Decoder | string | Uint8Array, offset?: number): Decoder {
    if (typeof value == "string") {
      const decoded = Hex.decode(value)
      if (decoded instanceof ClientError) throw decoded
      return new Decoder(decoded, offset)
    } else if ("length" in value) {
      return new Decoder(value, offset)
    }

    return value
  }

  advance(count: number) {
    this.offset += count
  }

  any1<T>(type: IDecodable<T>): T | ClientError {
    return type.decode(this)
  }

  any2<T1, T2>(value1: IDecodable<T1>, value2: IDecodable<T2>): [T1, T2] | ClientError {
    const v1 = value1.decode(this)
    if (v1 instanceof ClientError) return v1
    const v2 = value2.decode(this)
    if (v2 instanceof ClientError) return v2
    return [v1, v2]
  }

  any3<T1, T2, T3>(value1: IDecodable<T1>, value2: IDecodable<T2>, value3: IDecodable<T3>): [T1, T2, T3] | ClientError {
    const v1 = value1.decode(this)
    if (v1 instanceof ClientError) return v1
    const v2 = value2.decode(this)
    if (v2 instanceof ClientError) return v2
    const v3 = value3.decode(this)
    if (v3 instanceof ClientError) return v3

    return [v1, v2, v3]
  }

  any4<T1, T2, T3, T4>(
    value1: IDecodable<T1>,
    value2: IDecodable<T2>,
    value3: IDecodable<T3>,
    value4: IDecodable<T4>,
  ): [T1, T2, T3, T4] | ClientError {
    const v1 = value1.decode(this)
    if (v1 instanceof ClientError) return v1
    const v2 = value2.decode(this)
    if (v2 instanceof ClientError) return v2
    const v3 = value3.decode(this)
    if (v3 instanceof ClientError) return v3
    const v4 = value4.decode(this)
    if (v4 instanceof ClientError) return v4

    return [v1, v2, v3, v4]
  }

  any5<T1, T2, T3, T4, T5>(
    value1: IDecodable<T1>,
    value2: IDecodable<T2>,
    value3: IDecodable<T3>,
    value4: IDecodable<T4>,
    value5: IDecodable<T5>,
  ): [T1, T2, T3, T4, T5] | ClientError {
    const v1 = value1.decode(this)
    if (v1 instanceof ClientError) return v1
    const v2 = value2.decode(this)
    if (v2 instanceof ClientError) return v2
    const v3 = value3.decode(this)
    if (v3 instanceof ClientError) return v3
    const v4 = value4.decode(this)
    if (v4 instanceof ClientError) return v4
    const v5 = value5.decode(this)
    if (v5 instanceof ClientError) return v5

    return [v1, v2, v3, v4, v5]
  }

  len(): number {
    return this.internalArray.length
  }

  remainingLen(): number {
    return this.internalArray.length - this.offset
  }

  remainingBytes(): Uint8Array {
    const length = this.remainingLen()
    if (length == 0) return new Uint8Array()

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

  option<T>(T: IDecodable<T>): T | null | ClientError {
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

    if (!this.hasAtLeast(1)) return new ClientError("Not enough bytes to decode u8")

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

    if (!this.hasAtLeast(2)) return new ClientError("Not enough bytes to decode u16")

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

    if (!this.hasAtLeast(4)) return new ClientError("Not enough bytes to decode u32")

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 4)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 4
    return value.toNumber()
  }

  u64(compact?: boolean): BN | ClientError {
    if (compact === true) return this.compact()
    if (!this.hasAtLeast(8)) return new ClientError("Not enough bytes to decode u64")

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 8)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 8
    return value
  }

  u128(compact?: boolean): BN | ClientError {
    if (compact === true) return this.compact()
    if (!this.hasAtLeast(16)) return new ClientError("Not enough bytes to decode u128")

    const arrayValue = this.internalArray.slice(this.offset, this.offset + 16)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 16
    return value
  }

  compact(): BN | ClientError {
    try {
      const [offset, value] = compactFromU8a(this.internalArray.slice(this.offset))
      this.offset += offset
      if (offset == 0) return new ClientError("Failed to decode compat value")

      return value
    } catch (e: any) {
      return new ClientError(e.toString())
    }
  }

  // Dynamic Array (Has length Prefix)
  vec<T>(as: IDecodable<T>): T[] | ClientError {
    const length = this.u32(true)
    if (length instanceof ClientError) return length
    if (length == 0) return []

    const array = []
    for (let i = 0; i < length; ++i) {
      const decoded = as.decode(this)
      if (decoded instanceof ClientError) return decoded

      array.push(decoded)
    }

    return array
  }

  vecTuple2<T1, T2>(t1: IDecodable<T1>, t2: IDecodable<T2>): [T1, T2][] | ClientError {
    const length = this.u32(true)
    if (length instanceof ClientError) return length
    if (length == 0) return []

    const array: [T1, T2][] = []
    for (let i = 0; i < length; ++i) {
      const t1Decoded = t1.decode(this)
      if (t1Decoded instanceof ClientError) return t1Decoded

      const t2Decoded = t2.decode(this)
      if (t2Decoded instanceof ClientError) return t2Decoded

      array.push([t1Decoded, t2Decoded])
    }

    return array
  }

  // Dynamic Array (Has length Prefix)
  vecU8(): Uint8Array | ClientError {
    // Read Compact length
    const result = this.compact()
    if (result instanceof ClientError) return result

    const length = result.toNumber()
    if (length == 0) return new Uint8Array()

    const value = this.internalArray.slice(this.offset, this.offset + length)
    this.offset += length
    return value
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
    if (!this.hasAtLeast(count)) return new ClientError("Not enough bytes to decode bytes")

    const value = this.internalArray.slice(this.offset, this.offset + count)
    return value
  }

  peekUnsafe(count: number): Uint8Array {
    const value = this.internalArray.slice(this.offset, this.offset + count)
    return value
  }
}
