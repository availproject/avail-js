import { u8aToHex, hexToU8a } from "@polkadot/util"
import { encodeAddress, createKeyMulti, sortAddresses, xxhashAsU8a } from "@polkadot/util-crypto"
import { AvailError } from "./error"

export function hexEncode(value: Uint8Array): string {
  return u8aToHex(value)
}

export function hexDecode(value: string): Uint8Array | AvailError {
  try {
    return hexToU8a(value)
  } catch (e: any) {
    return new AvailError(e instanceof Error ? e.message : String(e))
  }
}

export function hexDecodeUnsafe(value: string): Uint8Array {
  return hexToU8a(value)
}

export class Duration {
  // In ms
  public value: number = 0
  constructor(ms: number) {
    this.value = ms
  }

  static fromSecs(value: number): Duration {
    return new Duration(value * 1000)
  }

  static fromMillis(value: number): Duration {
    return new Duration(value)
  }
}

// Milliseconds
export function sleep(value: Duration) {
  return new Promise((resolve) => setTimeout(resolve, value.value))
}

export function mergeArrays(arrays: Uint8Array[]): Uint8Array {
  const newLength = arrays.reduce((acc, cv) => acc + cv.length, 0)
  const newArray = new Uint8Array(newLength)

  let length = 0
  for (const array of arrays) {
    newArray.set(array, length)
    length += array.length
  }

  return newArray
}

export function generateMultisig(addresses: string[], threshold: number): string {
  const SS58Prefix = 42

  const multiAddress = createKeyMulti(addresses, threshold)
  const Ss58Address = encodeAddress(multiAddress, SS58Prefix)

  return Ss58Address
}

export function sortMultisigAddresses(addresses: string[]): string[] {
  const SS58Prefix = 42

  return sortAddresses(addresses, SS58Prefix)
}

export function twoX128(value: Uint8Array): Uint8Array {
  return xxhashAsU8a(value, 128)
}
