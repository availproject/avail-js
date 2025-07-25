import { compactAddLength } from "@polkadot/util"

export function encodeU8(value: number): Uint8Array {
  if (value > 255 || value < 0) {
    throw Error("Value cannot be more than 255 or less than 0")
  }

  const encodedValue = new Uint8Array(1)
  encodedValue[0] = value
  return encodedValue
}


function encodeU32(value: number): Uint8Array {
  if (value < 0 || value > 0xffffffff) {
    throw new Error("Value out of range for u32")
  }

  // Convert number to 4-byte little-endian Uint8Array
  const buffer = new Uint8Array(4)
  buffer[0] = value & 0xff // Least significant byte
  buffer[1] = (value >> 8) & 0xff
  buffer[2] = (value >> 16) & 0xff
  buffer[3] = (value >> 24) & 0xff // Most significant byte

  return buffer
}

export function encodeBytesWLen(value: Uint8Array): Uint8Array {
  return compactAddLength(value)
}
