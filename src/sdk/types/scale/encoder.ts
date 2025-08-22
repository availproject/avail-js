import { BN, u8aConcat } from "./../polkadot"
import { Encodable } from "./../../interface"
import { mergeArrays } from "./../../utils"
import { bnToU8a, compactAddLength, compactToU8a } from "./../polkadot"

export class Encoder {
  static bool(value: boolean): Uint8Array {
    const encodedValue = new Uint8Array(1)
    encodedValue[0] = value ? 1 : 0
    return encodedValue
  }

  static concat(...list: Encodable[]): Uint8Array {
    return mergeArrays(list.map((x) => x.encode()))
  }

  /// Can Throw
  static u8(value: number, compact?: boolean): Uint8Array {
    if (value > 255 || value < 0) throw Error("Value cannot be more than 255 or less than 0")
    if (compact == true) return compactToU8a(value)

    const encodedValue = new Uint8Array(1)
    encodedValue[0] = value
    return encodedValue
  }

  /// Can Throw
  static u16(value: number, compact?: boolean): Uint8Array {
    if (value < 0 || value > 0xffff) throw new Error("Value out of range for u16")
    if (compact == true) return compactToU8a(value)

    // Convert number to 4-byte little-endian Uint8Array
    const buffer = new Uint8Array(2)
    buffer[0] = value & 0xff // Least significant byte
    buffer[1] = (value >> 8) & 0xff // Most significant byte

    return buffer
  }

  /// Can Throw
  static u32(value: number, compact?: boolean): Uint8Array {
    if (value < 0 || value > 0xffffffff) throw new Error("Value out of range for u32")
    if (compact == true) return compactToU8a(value)

    // Convert number to 4-byte little-endian Uint8Array
    const buffer = new Uint8Array(4)
    buffer[0] = value & 0xff // Least significant byte
    buffer[1] = (value >> 8) & 0xff
    buffer[2] = (value >> 16) & 0xff
    buffer[3] = (value >> 24) & 0xff // Most significant byte

    return buffer
  }

  /// Can Throw
  static u64(value: BN, compact?: boolean): Uint8Array {
    if (value.isNeg()) throw new Error("Cannot encode negative U64 values")
    if (compact == true) return compactToU8a(value)

    return bnToU8a(value, { isLe: true, isNegative: false, bitLength: 64 })
  }

  /// Can Throw
  static u128(value: BN, compact?: boolean): Uint8Array {
    if (value.isNeg()) throw new Error("Cannot encode negative U128 values")
    if (compact == true) return compactToU8a(value)

    return bnToU8a(value, { isLe: true, isNegative: false, bitLength: 128 })
  }

  /// Can Throw
  static compact(value: BN): Uint8Array {
    if (value.isNeg()) throw new Error("Cannot encode negative U128 values")

    return compactToU8a(value)
  }

  static any1(T: Encodable): Uint8Array {
    return T.encode()
  }

  static option(T: Encodable | null): Uint8Array {
    if (T == null) return Encoder.u8(0)

    return u8aConcat(Encoder.u8(1), T.encode())
  }

  static result(T: Encodable, success: boolean): Uint8Array {
    if (!success) return u8aConcat(Encoder.u8(1), Encoder.any1(T))

    return u8aConcat(Encoder.u8(0), Encoder.any1(T))
  }

  static enum(variant: number, T: Encodable | Uint8Array): Uint8Array {
    if ("encode" in T) return mergeArrays([Encoder.u8(variant), Encoder.any1(T)])

    return u8aConcat(Encoder.u8(variant), T)
  }

  // Dynamic Array (Has length Prefix)
  static vec(value: Encodable[]): Uint8Array {
    const encodedLength = Encoder.u32(value.length, true)
    const array = []
    for (let i = 0; i < value.length; ++i) {
      array.push(value[i].encode())
    }
    const encodedElements = mergeArrays(array)
    return u8aConcat(encodedLength, encodedElements)
  }

  // Dynamic Array (Has length Prefix)
  static vecU8(value: Uint8Array): Uint8Array {
    return compactAddLength(value)
  }
}
