import ClientError from "./error"
import { OpaqueTransaction } from "./transaction"
import { Decoder, Encoder } from "./types/scale"
import { Hex, mergeArrays } from "./utils"

export interface Decodable<T> {
  decode(decoder: Decoder): T | ClientError
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
  static decodeHex<T>(T: Decodable<T> & HasEventEmittedIndex, value: string): T | null {
    const decoded = Hex.decode(value)
    if (decoded instanceof ClientError) {
      return null
    }
    return EventCodec.decodeScale(T, decoded)
  }

  static decodeScale<T>(T: Decodable<T> & HasEventEmittedIndex, value: Uint8Array): T | null {
    return EventCodec.decode(T, new Decoder(value))
  }

  static decode<T>(T: Decodable<T> & HasEventEmittedIndex, decoder: Decoder): T | null {
    if (decoder.remainingLen() < 2) {
      return null
    }
    const emittedIndex = T.emittedIndex()
    const readPalletIndex = decoder.byte()
    if (readPalletIndex instanceof ClientError) {
      return null
    }

    const readVariantIndex = decoder.byte()
    if (readVariantIndex instanceof ClientError) {
      return null
    }

    if (emittedIndex[0] != readPalletIndex || emittedIndex[1] != readVariantIndex) {
      return null
    }

    const decoded = T.decode(decoder)
    if (decoded instanceof ClientError) {
      return null
    }

    return decoded
  }

  static decodeHexData<T>(T: Decodable<T>, value: string): T | null {
    const decoded = Hex.decode(value)
    if (decoded instanceof ClientError) {
      return null
    }

    return EventCodec.decodeScaleData(T, decoded)
  }

  static decodeScaleData<T>(T: Decodable<T>, value: Uint8Array): T | null {
    return EventCodec.decodeData(T, new Decoder(value))
  }

  static decodeData<T>(T: Decodable<T>, decoder: Decoder): T | null {
    const decoded = T.decode(decoder)
    if (decoded instanceof ClientError) {
      return null
    }

    return decoded
  }

  static encode(T: Encodable & HasEventEmittedIndex): Uint8Array {
    const [palletId, variantId] = T.emittedIndex()
    return mergeArrays([Encoder.u8(palletId), Encoder.u8(variantId), T.encode()])
  }

  static encodeHex(T: Encodable & HasEventEmittedIndex): string {
    return Hex.encode(EventCodec.encode(T))
  }
}

export class TransactionCallCodec {
  static decodeHexCall<T>(T: Decodable<T> & HasTxDispatchIndex, value: string): T | null {
    const decoded = Hex.decode(value)
    if (decoded instanceof ClientError) {
      return null
    }
    return TransactionCallCodec.decodeScaleCall(T, decoded)
  }

  static decodeScaleCall<T>(T: Decodable<T> & HasTxDispatchIndex, value: Uint8Array): T | null {
    return TransactionCallCodec.decodeCall(T, new Decoder(value))
  }

  static decodeCall<T>(T: Decodable<T> & HasTxDispatchIndex, decoder: Decoder): T | null {
    if (decoder.remainingLen() < 2) {
      return null
    }

    const dispatchIndex = T.dispatchIndex()
    const readPalletIndex = decoder.byte()
    if (readPalletIndex instanceof ClientError) return null

    const readCallIndex = decoder.byte()
    if (readCallIndex instanceof ClientError) return null

    if (dispatchIndex[0] != readPalletIndex || dispatchIndex[1] != readCallIndex) {
      return null
    }

    const decoded = T.decode(decoder)
    if (decoded instanceof ClientError) {
      return null
    }

    return decoded
  }

  static decodeHexCallData<T>(T: Decodable<T>, value: string): T | null {
    const decoded = Hex.decode(value)
    if (decoded instanceof ClientError) return null

    return TransactionCallCodec.decodeScaleCallData(T, decoded)
  }

  static decodeScaleCallData<T>(T: Decodable<T>, value: Uint8Array): T | null {
    return TransactionCallCodec.decodeCallData(T, new Decoder(value))
  }

  static decodeCallData<T>(T: Decodable<T>, decoder: Decoder): T | null {
    const decoded = T.decode(decoder)
    if (decoded instanceof ClientError) return null

    return decoded
  }

  static decodeHexTransaction<T>(T: Decodable<T> & HasTxDispatchIndex, value: string): T | null {
    const decoded = Hex.decode(value)
    if (decoded instanceof ClientError) return null

    return TransactionCallCodec.decodeScaleTransaction(T, decoded)
  }

  static decodeScaleTransaction<T>(T: Decodable<T> & HasTxDispatchIndex, value: Uint8Array): T | null {
    return TransactionCallCodec.decodeTransaction(T, new Decoder(value))
  }

  static decodeTransaction<T>(T: Decodable<T> & HasTxDispatchIndex, decoder: Decoder): T | null {
    const opaque = OpaqueTransaction.decode(decoder)
    if (opaque instanceof ClientError) return null

    return TransactionCallCodec.decodeScaleCall(T, opaque.call)
  }
}
