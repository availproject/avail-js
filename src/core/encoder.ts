import { BN, bnToU8a, compactAddLength, compactToU8a } from "@polkadot/util"
import { mergeArrays } from "./utils"
import { Encodable } from "./decode_transaction"

export default class Encoder {
  static u8(value: number, compact?: boolean): Uint8Array {
    if (value > 255 || value < 0) {
      throw Error("Value cannot be more than 255 or less than 0")
    }

    if (compact == true) {
      return compactToU8a(value)
    }

    const encodedValue = new Uint8Array(1)
    encodedValue[0] = value
    return encodedValue
  }

  static u16(value: number, compact?: boolean): Uint8Array {
    if (value < 0 || value > 0xffff) {
      throw new Error("Value out of range for u16")
    }

    if (compact == true) {
      return compactToU8a(value)
    }

    // Convert number to 4-byte little-endian Uint8Array
    const buffer = new Uint8Array(2)
    buffer[0] = value & 0xff // Least significant byte
    buffer[1] = (value >> 8) & 0xff // Most significant byte

    return buffer
  }

  static u32(value: number, compact?: boolean): Uint8Array {
    if (value < 0 || value > 0xffffffff) {
      throw new Error("Value out of range for u32")
    }

    if (compact == true) {
      return compactToU8a(value)
    }

    // Convert number to 4-byte little-endian Uint8Array
    const buffer = new Uint8Array(4)
    buffer[0] = value & 0xff // Least significant byte
    buffer[1] = (value >> 8) & 0xff
    buffer[2] = (value >> 16) & 0xff
    buffer[3] = (value >> 24) & 0xff // Most significant byte

    return buffer
  }

  static u64(value: BN, compact?: boolean): Uint8Array {
    if (value.isNeg()) {
      throw new Error("Cannot encode negative U64 values")
    }

    if (compact == true) {
      return compactToU8a(value)
    }

    return bnToU8a(value, { isLe: true, isNegative: false, bitLength: 512 })
  }

  static u128(value: BN, compact?: boolean): Uint8Array {
    if (value.isNeg()) {
      throw new Error("Cannot encode negative U128 values")
    }

    if (compact == true) {
      return compactToU8a(value)
    }

    return bnToU8a(value, { isLe: true, isNegative: false, bitLength: 1024 })
  }

  static compact(value: BN): Uint8Array {
    if (value.isNeg()) {
      throw new Error("Cannot encode negative U128 values")
    }

    return compactToU8a(value)
  }

  static any(T: Encodable): Uint8Array {
    return T.encode()
  }

  static encodeBytesWLen(value: Uint8Array): Uint8Array {
    return compactAddLength(value)
  }

  static array(value: Encodable[]): Uint8Array {
    const encodedLength = Encoder.u32(value.length, true)
    const array = []
    for (let i = 0; i < value.length; ++i) {
      array.push(value[i].encode())
    }
    const encodedElements = mergeArrays(array)
    return mergeArrays([encodedLength, encodedElements])
  }
}
