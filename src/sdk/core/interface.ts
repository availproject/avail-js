import { type IDecodable, Decoder } from "./scale/decoder"
import { type IEncodable, Encoder } from "./scale/encoder"
import { AvailError } from "./misc/error"
import { u8aConcat } from "@polkadot/util"

export interface IStorageValue<V> {
  encodeStorageKey(): Uint8Array
  decodeValue(decoder: Decoder): V | AvailError
}

export interface IStorageMap<V, K> {
  encodeStorageKey(key: K): Uint8Array
  decodeValue(decoder: Decoder): V | AvailError
}

export interface IStorageDoubleMap<V, K1, K2> {
  encodeStorageKey(key1: K1, key2: K2): Uint8Array
  decodeValue(decoder: Decoder): V | AvailError
}

export interface IStorageMapIterator<V, K> {
  encodePartialKey(): Uint8Array
  decodeStorageKey(encodedKey: Uint8Array): K | AvailError
  decodeStorageValue(encodedValue: Uint8Array): V | AvailError
}

export interface IStorageDoubleMapIterator<V, K1, K2> {
  encodePartialKey(key1: K1): Uint8Array
  decodeStorageKey(encodedKey: Uint8Array): [K1, K2] | AvailError
  decodeStorageValue(encodedValue: Uint8Array): V | AvailError
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

export class IEvent {
  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string): T | null
  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string, withError: true): T | AvailError
  static decode<T>(
    as: IHeaderAndDecodable<T>,
    value: Decoder | Uint8Array | string,
    withError?: boolean,
  ): T | null | AvailError {
    return withError === true ? decodeInternal(as, value, true) : decodeInternal(as, value)
  }

  static decodeParts<T>(
    palletId: number,
    variantId: number,
    decodeData: (decoder: Decoder) => T | AvailError,
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
  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string): T | null
  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string, withError: true): T | AvailError
  static decode<T>(
    as: IHeaderAndDecodable<T>,
    value: Decoder | Uint8Array | string,
    withError?: boolean,
  ): T | null | AvailError {
    return withError === true ? decodeInternal(as, value, true) : decodeInternal(as, value)
  }

  static decodeParts<T>(
    palletId: number,
    variantId: number,
    decodeData: (decoder: Decoder) => T | AvailError,
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

function decodeInternal<T>(type: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string): T | null
function decodeInternal<T>(
  type: IHeaderAndDecodable<T>,
  value: Decoder | Uint8Array | string,
  withError: true,
): T | AvailError
function decodeInternal<T>(
  type: IHeaderAndDecodable<T>,
  value: Decoder | Uint8Array | string,
  withError?: boolean,
): T | null | AvailError {
  const decoder = Decoder.from(value)
  if (decoder instanceof AvailError) {
    if (withError === true) {
      return decoder
    } else {
      return null
    }
  }

  const palletId = decoder.byte()
  if (palletId instanceof AvailError) {
    if (withError === true) {
      return palletId
    } else {
      return null
    }
  }

  if (palletId != type.palletId()) {
    if (withError === true) {
      return new AvailError(`Pallet ID mismatch. Actual: ${palletId}, Expected: ${type.palletId()}`)
    } else {
      return null
    }
  }

  const variantId = decoder.byte()
  if (variantId instanceof AvailError) {
    if (withError === true) {
      return variantId
    } else {
      return null
    }
  }

  if (variantId != type.variantId()) {
    if (withError === true) {
      return new AvailError(`Variant ID mismatch. Actual: ${palletId}, Expected: ${type.palletId()}`)
    } else {
      return null
    }
  }

  const decoded = type.decode(decoder)
  if (decoded instanceof AvailError) {
    if (withError === true) {
      return decoded
    } else {
      return null
    }
  }

  return decoded
}

function encodeInternal(value: IHeaderAndEncodable): Uint8Array {
  return u8aConcat(Encoder.u8(value.palletId()), Encoder.u8(value.variantId()), value.encode())
}
