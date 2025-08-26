import { createKeyMulti, encodeAddress, hexToU8a, sortAddresses, u8aToHex } from "./types/polkadot"
import ClientError from "./error"

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

export class Hex {
  static encode(value: Uint8Array): string {
    return u8aToHex(value)
  }

  /// Cannot Throw
  /// Works both with and without 0x as prefix
  static decode(value: string): Uint8Array | ClientError {
    try {
      return hexToU8a(value)
    } catch (e: any) {
      return new ClientError(e.toString())
    }
  }
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
