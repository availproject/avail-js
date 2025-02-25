import { BN } from "./.";
import { compactFromU8a } from "@polkadot/util"

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

  return input.slice(8);
}

export function partiallyDecodeKey(input: ArrayBuffer, hasher: Hasher): Uint8Array {
  if (hasher == Hasher.BLAKE2_128_CONCAT) {
    return new Uint8Array(decodeBlake2_128Concat(input.slice(32)))
  } else if (hasher == Hasher.TWOX64_CONCAT) {
    return new Uint8Array(decodeTwox64Concat(input.slice(32)))
  }

  throw new Error("Unknown Hasher")
}

export class Decoder {
  constructor(public array: Uint8Array, public offset: number) { }

  len(): number {
    return this.array.length
  }

  remainingLen(): number {
    return this.array.length - this.offset
  }

  hasAtLeast(count: number): boolean {
    return this.remainingLen() >= count
  }

  decodeU8(): number {
    if (!this.hasAtLeast(1)) {
      throw new Error("Not enough bytes to decode u8")
    }

    const arrayValue = this.array.slice(this.offset, this.offset + 1)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 1;
    return value.toNumber()
  }

  decodeU16(): number {
    if (!this.hasAtLeast(2)) {
      throw new Error("Not enough bytes to decode u16")
    }


    const arrayValue = this.array.slice(this.offset, this.offset + 2)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 2;
    return value.toNumber()
  }

  decodeU32(compact?: boolean): number {
    compact ??= false

    if (compact) {
      const [offset, value] = compactFromU8a(this.array.slice(this.offset))
      this.offset += offset
      return value.toNumber()
    }

    if (!this.hasAtLeast(4)) {
      throw new Error("Not enough bytes to decode u32")
    }

    const arrayValue = this.array.slice(this.offset, this.offset + 4)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 4;
    return value.toNumber()
  }

  decodeU64(compact?: boolean): BN {
    compact ??= false

    if (compact) {
      const [offset, value] = compactFromU8a(this.array.slice(this.offset))
      this.offset += offset
      return value
    }

    if (!this.hasAtLeast(8)) {
      throw new Error("Not enough bytes to decode u64")
    }

    const arrayValue = this.array.slice(this.offset, this.offset + 8)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 8;
    return value
  }

  decodeU128(compact?: boolean): BN {
    compact ??= false

    if (compact) {
      throw new Error("Compact for u128 has not been implemented")
    }

    if (!this.hasAtLeast(16)) {
      throw new Error("Not enough bytes to decode u128")
    }

    const arrayValue = this.array.slice(this.offset, this.offset + 16)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 16;
    return value
  }

  // Fixed Array
  bytes(count: number): Uint8Array {
    if (!this.hasAtLeast(count)) {
      throw new Error("Not enough bytes to decode bytes")
    }

    const value = this.array.slice(this.offset, this.offset + count)
    this.offset += count;
    return value
  }

  // Dynamic Array like Vec
  bytesWLen(): Uint8Array {
    // Read Compact length
    const [offset, length] = compactFromU8a(this.array.slice(this.offset))
    this.offset += offset
    if (length.toNumber() == 0) {
      return new Uint8Array()
    }

    const value = this.array.slice(this.offset, this.offset + length.toNumber())
    this.offset += length.toNumber();
    return value
  }
}