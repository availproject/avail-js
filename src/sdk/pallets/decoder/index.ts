import { BN } from "../..";
import { compactFromU8a } from "@polkadot/util"
import { blake2AsU8a } from '@polkadot/util-crypto';

export const HASHER_BLAKE2_128: number = 0
export const HASHER_TWOX64_CONCAT: number = 1

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

export function partiallyDecodeKey(input: ArrayBuffer, hasher: number): Uint8Array {
  if (hasher == HASHER_BLAKE2_128) {
    return new Uint8Array(decodeBlake2_128Concat(input.slice(32)))
  } else if (hasher == HASHER_TWOX64_CONCAT) {
    return new Uint8Array(decodeTwox64Concat(input.slice(32)))
  }

  throw new Error("Unknown Hasher")
}

export function uint8ArrayToHex(byteArray: Uint8Array): string {
  return "0x" + Array.from(byteArray)
    .map(byte => byte.toString(16).padStart(2, '0')) // Convert each byte to a 2-digit hex string
    .join('');  // Join all the hex values into a single string
}


export class Decoder {
  constructor(public array: Uint8Array, public offset: number) { }

  decodeU8(): number {
    const arrayValue = this.array.slice(this.offset, this.offset + 1)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 1;
    return value.toNumber()
  }

  decodeU16(): number {
    const arrayValue = this.array.slice(this.offset, this.offset + 2)
    const view = new DataView(arrayValue.buffer)

    this.offset += 2;
    return view.getUint16(0, true)
  }

  decodeU32(compact?: boolean): number {
    compact ??= false
    const arrayValue = this.array.slice(this.offset, this.offset + 4)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 4;
    return value.toNumber()
  }

  decodeU64(compact?: boolean): BN {
    compact ??= false
    const arrayValue = this.array.slice(this.offset, this.offset + 8)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 8;
    return value
  }

  decodeU128(compact?: boolean): BN {
    compact ??= false
    const arrayValue = this.array.slice(this.offset, this.offset + 16)
    const value = new BN(arrayValue, "hex", "le")

    this.offset += 16;
    return value
  }
}