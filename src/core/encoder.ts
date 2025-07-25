import { compactAddLength } from "@polkadot/util"

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
