import { type IDecodable, Decoder } from "./scale/decoder"
import { type IEncodable, Encoder } from "./scale/encoder"
import { ValidationError } from "../errors/sdk-error"
import { u8aConcat } from "@polkadot/util"

export interface IStorageValue<V> {
  encodeStorageKey(): Uint8Array
  decodeValue(decoder: Decoder): V
}

export interface IStorageMap<V, K> {
  encodeStorageKey(key: K): Uint8Array
  decodeValue(decoder: Decoder): V
}

export interface IStorageDoubleMap<V, K1, K2> {
  encodeStorageKey(key1: K1, key2: K2): Uint8Array
  decodeValue(decoder: Decoder): V
}

export interface IStorageMapIterator<V, K> {
  encodePartialKey(): Uint8Array
  decodeStorageKey(encodedKey: Uint8Array): K
  decodeStorageValue(encodedValue: Uint8Array): V
}

export interface IStorageDoubleMapIterator<V, K1, K2> {
  encodePartialKey(key1: K1): Uint8Array
  decodeStorageKey(encodedKey: Uint8Array): [K1, K2]
  decodeStorageValue(encodedValue: Uint8Array): V
}

export interface IHeader {
  palletId(): number
  variantId(): number
}

export interface IHeaderAndEncodable extends IHeader, IEncodable {}
export interface IHeaderAndDecodable<T> extends IHeader, IDecodable<T> {}

export function addHeader(PALLET_ID: number, VARIANT_ID: number) {
  abstract class Header {
    static palletId(): number {
      return PALLET_ID
    }
    static variantId(): number {
      return VARIANT_ID
    }
    palletId(): number {
      return Header.palletId()
    }
    variantId(): number {
      return Header.variantId()
    }
  }

  return Header
}

export function scaleDecodeExtrinsicCall<T>(as: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string) {
  return decodeInternal(as, value)
}
export function scaleDecodeEvent<T>(as: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string) {
  return decodeInternal(as, value)
}

export class IEvent {
  static decodeParts<T>(
    palletId: number,
    variantId: number,
    decodeData: (decoder: Decoder) => T,
    value: Decoder | Uint8Array | string,
  ): T | null {
    const obj = {
      palletId: () => {
        return palletId
      },
      variantId: () => {
        return variantId
      },
      decode: decodeData,
    }
    return decodeInternal(obj, value)
  }

  static encode(value: IHeaderAndEncodable): Uint8Array {
    return encodeInternal(value)
  }
}

export class ICall {
  static decodeParts<T>(
    palletId: number,
    variantId: number,
    decodeData: (decoder: Decoder) => T,
    value: Decoder | Uint8Array | string,
  ): T | null {
    const obj = {
      palletId: () => {
        return palletId
      },
      variantId: () => {
        return variantId
      },
      decode: decodeData,
    }
    return decodeInternal(obj, value)
  }

  static encode(value: IHeaderAndEncodable): Uint8Array {
    return encodeInternal(value)
  }
}

function decodeInternal<T>(as: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string): T {
  const decoder = Decoder.from(value)
  const palletId = decoder.byte()

  if (palletId != as.palletId())
    throw new ValidationError(`Pallet ID mismatch. Actual: ${palletId}, Expected: ${as.palletId()}`)

  const variantId = decoder.byte()

  if (variantId != as.variantId())
    throw new ValidationError(`Variant ID mismatch. Actual: ${palletId}, Expected: ${as.palletId()}`)

  return as.decode(decoder)
}

function encodeInternal(value: IHeaderAndEncodable): Uint8Array {
  return u8aConcat(Encoder.u8(value.palletId()), Encoder.u8(value.variantId()), value.encode())
}
