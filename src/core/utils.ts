import { GeneralError, hexToU8a, u8aToHex } from "../client"

export function sleepSeconds(s: number) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000))
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  public static encode(value: Uint8Array): string {
    return u8aToHex(value)
  }

  public static decode(value: string): Uint8Array | GeneralError {
    try {
      return hexToU8a(value)
    } catch (e: any) {
      return new GeneralError(e.toString())
    }
  }
}
