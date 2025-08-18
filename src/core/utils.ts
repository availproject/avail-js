import { GeneralError, hexToU8a, u8aToHex } from "./."

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

export class OS {
  // Milliseconds
  static sleep(value: Duration) {
    return new Promise((resolve) => setTimeout(resolve, value.value))
  }
}

export class Utils {
  static mergeArrays(arrays: Uint8Array[]): Uint8Array {
    const newLength = arrays.reduce((acc, cv) => acc + cv.length, 0)
    const newArray = new Uint8Array(newLength)

    let length = 0
    for (const array of arrays) {
      newArray.set(array, length)
      length += array.length
    }

    return newArray
  }
}

export class Hex {
  static encode(value: Uint8Array): string {
    return u8aToHex(value)
  }

  static decode(value: string): Uint8Array | GeneralError {
    try {
      return hexToU8a(value)
    } catch (e: any) {
      return new GeneralError(e.toString())
    }
  }
}
