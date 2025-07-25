import { compactAddLength } from "@polkadot/util"

export interface EncodableCallT {
  dispatchIndex(): [number, number]
  encode(): Uint8Array
}

export interface DecodableCallT<T> {
  dispatchIndex(): [number, number]
  decode(data: Uint8Array): T | null
}

export function encodeCall(call: EncodableCallT): Uint8Array {
  const dispatchIndex = call.dispatchIndex()
  return mergeArrays([encodeU8(dispatchIndex[0]), encodeU8(dispatchIndex[1]), call.encode()])
}

export abstract class DecodableCall<T> {
  abstract dispatchIndex(): [number, number]
  abstract decode(data: Uint8Array): T | null

  decodeCall(data: Uint8Array): T | null {
    // TODO
    const palletIndex = data[0]
    const variantIndex = data[1]
    const dispatchIndex = this.dispatchIndex()

    if (palletIndex != dispatchIndex[0] || variantIndex != dispatchIndex[1]) {
      return null
    }

    return this.decode(data.subarray(2))
  }
}

export abstract class EncodableDecodableCall<T> {
  abstract dispatchIndex(): [number, number]
  abstract encode(): Uint8Array
  abstract decode(data: Uint8Array): T | null

  encodeCall(): Uint8Array {
    const dispatchIndex = this.dispatchIndex()
    return mergeArrays([encodeU8(dispatchIndex[0]), encodeU8(dispatchIndex[1]), this.encode()])
  }

  decodeCall(data: Uint8Array): T | null {
    const dispatchIndex = this.dispatchIndex()
    if (data[0] != dispatchIndex[0] || data[1] != dispatchIndex[1]) {
      return null
    }

    return this.decode(data.subarray(2))
  }
}

/* export abstract class DecodableCall<T> {
  abstract decodeCall(): T | null
} */

/* export function encodeCall(value: callAble): Uint8Array {
  const dispatchIndex = value.dispatchIndex()
  return mergeArrays([encodeU8(dispatchIndex[0]), encodeU8(dispatchIndex[1]), value.encode()])
} */

export function encodeU8(value: number): Uint8Array {
  if (value > 255 || value < 0) {
    throw Error("Value cannot be more than 255 or less than 0")
  }

  const encodedValue = new Uint8Array(1)
  encodedValue[0] = value
  return encodedValue
}

export function encodeBytesWLen(value: Uint8Array): Uint8Array {
  return compactAddLength(value)
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
