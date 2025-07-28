import { GeneralError } from "."
import { Decodable, Encodable } from "./decoded_encoded"
import Decoder from "./decoder"
import Encoder from "./encoder"
import { Hex, mergeArrays } from "./utils"

export interface HasEventEmittedIndex {
  emittedIndex(): [number, number]
}

export function decodeHexEvent<T>(T: Decodable<T> & HasEventEmittedIndex, value: string): T | null {
  const decoded = Hex.decode(value)
  if (decoded instanceof GeneralError) {
    return null
  }
  return decodeScaleEvent(T, decoded)
}

export function decodeScaleEvent<T>(T: Decodable<T> & HasEventEmittedIndex, value: Uint8Array): T | null {
  return decodeEvent(T, new Decoder(value))
}

export function decodeEvent<T>(T: Decodable<T> & HasEventEmittedIndex, decoder: Decoder): T | null {
  if (decoder.remainingLen() < 2) {
    return null
  }
  const emittedIndex = T.emittedIndex()
  const readPalletIndex = decoder.byte()
  if (readPalletIndex instanceof GeneralError) {
    return null
  }

  const readVariantIndex = decoder.byte()
  if (readVariantIndex instanceof GeneralError) {
    return null
  }

  if (emittedIndex[0] != readPalletIndex || emittedIndex[1] != readVariantIndex) {
    return null
  }

  const decoded = T.decode(decoder)
  if (decoded instanceof GeneralError) {
    return null
  }

  return decoded
}

export function decodeHexCallData<T>(T: Decodable<T>, value: string): T | null {
  const decoded = Hex.decode(value)
  if (decoded instanceof GeneralError) {
    return null
  }

  return decodeScaleEventData(T, decoded)
}

export function decodeScaleEventData<T>(T: Decodable<T>, value: Uint8Array): T | null {
  return decodeEventData(T, new Decoder(value))
}

export function decodeEventData<T>(T: Decodable<T>, decoder: Decoder): T | null {
  const decoded = T.decode(decoder)
  if (decoded instanceof GeneralError) {
    return null
  }

  return decoded
}

export function encodeAsEvent(T: Encodable & HasEventEmittedIndex): Uint8Array {
  const [palletId, variantId] = T.emittedIndex()
  return mergeArrays([Encoder.u8(palletId), Encoder.u8(variantId), T.encode()])
}

export function encodeAsHexEvent(T: Encodable & HasEventEmittedIndex): string {
  return Hex.encode(encodeAsEvent(T))
}
