import { GeneralError, Hex, Utils, Decoder, Encoder } from "."

export interface Decodable<T> {
  decode(decoder: Decoder): T | GeneralError
}
export interface Encodable {
  encode(): Uint8Array
}

export interface HasEventEmittedIndex {
  emittedIndex(): [number, number]
}

export interface HasTxDispatchIndex {
  dispatchIndex(): [number, number]
}

export class EventCodec {
  static decodeHexEvent<T>(T: Decodable<T> & HasEventEmittedIndex, value: string): T | null {
    const decoded = Hex.decode(value)
    if (decoded instanceof GeneralError) {
      return null
    }
    return EventCodec.decodeScaleEvent(T, decoded)
  }

  static decodeScaleEvent<T>(T: Decodable<T> & HasEventEmittedIndex, value: Uint8Array): T | null {
    return EventCodec.decodeEvent(T, new Decoder(value))
  }

  static decodeEvent<T>(T: Decodable<T> & HasEventEmittedIndex, decoder: Decoder): T | null {
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

  static decodeHexCallData<T>(T: Decodable<T>, value: string): T | null {
    const decoded = Hex.decode(value)
    if (decoded instanceof GeneralError) {
      return null
    }

    return EventCodec.decodeScaleEventData(T, decoded)
  }

  static decodeScaleEventData<T>(T: Decodable<T>, value: Uint8Array): T | null {
    return EventCodec.decodeEventData(T, new Decoder(value))
  }

  static decodeEventData<T>(T: Decodable<T>, decoder: Decoder): T | null {
    const decoded = T.decode(decoder)
    if (decoded instanceof GeneralError) {
      return null
    }

    return decoded
  }

  static encodeAsEvent(T: Encodable & HasEventEmittedIndex): Uint8Array {
    const [palletId, variantId] = T.emittedIndex()
    return Utils.mergeArrays([Encoder.u8(palletId), Encoder.u8(variantId), T.encode()])
  }

  static encodeAsHexEvent(T: Encodable & HasEventEmittedIndex): string {
    return Hex.encode(EventCodec.encodeAsEvent(T))
  }
}

export class TransactionCallCodec {
  static decodeHex<T>(T: Decodable<T> & HasTxDispatchIndex, value: string): T | null {
    const decoded = Hex.decode(value)
    if (decoded instanceof GeneralError) {
      return null
    }
    return TransactionCallCodec.decodeScale(T, decoded)
  }

  static decodeScale<T>(T: Decodable<T> & HasTxDispatchIndex, value: Uint8Array): T | null {
    return TransactionCallCodec.decode(T, new Decoder(value))
  }

  static decode<T>(T: Decodable<T> & HasTxDispatchIndex, decoder: Decoder): T | null {
    if (decoder.remainingLen() < 2) {
      return null
    }

    const dispatchIndex = T.dispatchIndex()
    const readPalletIndex = decoder.byte()
    if (readPalletIndex instanceof GeneralError) return null

    const readCallIndex = decoder.byte()
    if (readCallIndex instanceof GeneralError) return null

    if (dispatchIndex[0] != readPalletIndex || dispatchIndex[1] != readCallIndex) {
      return null
    }

    const decoded = T.decode(decoder)
    if (decoded instanceof GeneralError) {
      return null
    }

    return decoded
  }

  static decodeHexData<T>(T: Decodable<T>, value: string): T | null {
    const decoded = Hex.decode(value)
    if (decoded instanceof GeneralError) {
      return null
    }
    return TransactionCallCodec.decodeScaleData(T, decoded)
  }

  static decodeScaleData<T>(T: Decodable<T>, value: Uint8Array): T | null {
    return TransactionCallCodec.decodeData(T, new Decoder(value))
  }

  static decodeData<T>(T: Decodable<T>, decoder: Decoder): T | null {
    const decoded = T.decode(decoder)
    if (decoded instanceof GeneralError) {
      return null
    }

    return decoded
  }
}
