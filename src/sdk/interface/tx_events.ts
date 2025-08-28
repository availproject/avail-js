import { ClientError } from "../error"
import { OpaqueTransaction } from "../transaction"
import { u8aConcat } from "../types/polkadot"
import { Decoder, Encoder } from "../types/scale"

export interface IHeader {
  palletId(): number
  variantId(): number
}

export interface IEncodable {
  encode(): Uint8Array
}

export interface IDecodable<T> {
  decode(decoder: Decoder): T | ClientError
}

export interface IHeaderAndEncodable extends IHeader, IEncodable {}
export interface IHeaderAndDecodable<T> extends IHeader, IDecodable<T> {}

export function addHeader(PALLET_ID: number, VARIANT_ID: number) {
  abstract class Header implements IHeader {
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
  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string): T | null {
    return decodeInternal(as, value)
  }

  static decodeParts<T>(
    palletId: number,
    variantId: number,
    decodeData: (decoder: Decoder) => T | ClientError,
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
  static decode<T>(as: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string): T | null {
    return decodeInternal(as, value)
  }

  static decodeParts<T>(
    palletId: number,
    variantId: number,
    decodeData: (decoder: Decoder) => T | ClientError,
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

  static decodeTransaction<T>(as: IHeaderAndDecodable<T>, value: Decoder | string | Uint8Array): T | null {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return null

    const opaque = OpaqueTransaction.decode(decoder)
    if (opaque instanceof ClientError) return null

    return ICall.decode(as, opaque.call)
  }

  static encode(value: IHeaderAndEncodable): Uint8Array {
    return encodeInternal(value)
  }
}

function decodeInternal<T>(type: IHeaderAndDecodable<T>, value: Decoder | Uint8Array | string): T | null {
  const decoder = Decoder.from(value)
  if (decoder instanceof ClientError) return null

  const palletId = decoder.byte()
  if (palletId instanceof ClientError || type.palletId() != palletId) return null

  const variantId = decoder.byte()
  if (variantId instanceof ClientError || type.variantId() != variantId) return null

  const decoded = type.decode(decoder)
  if (decoded instanceof ClientError) return null
  return decoded
}

function encodeInternal(value: IHeaderAndEncodable): Uint8Array {
  return u8aConcat(Encoder.u8(value.palletId()), Encoder.u8(value.variantId()), value.encode())
}
