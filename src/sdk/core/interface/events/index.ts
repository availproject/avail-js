import { AvailError } from "../../error"
import { u8aConcat } from "../../types/polkadot"
import { Decoder, Encoder } from "../../types/scale"

export interface IHeader {
  palletId(): number
  variantId(): number
}

export interface IEncodable {
  encode(): Uint8Array
}

export interface IDecodable<T> {
  decode(decoder: Decoder): T | AvailError
}

export interface IHeaderAndEncodable extends IHeader, IEncodable {}
export interface IHeaderAndDecodable<T> extends IHeader, IDecodable<T> {}

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
