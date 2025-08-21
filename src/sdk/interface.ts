import ClientError from "./error"
import { OpaqueTransaction } from "./transaction"
import { H256 } from "./types"
import { stringToU8a, u8aConcat, xxhashAsU8a } from "./types/polkadot"
import { Decoder, Encoder } from "./types/scale"
import { Hex, mergeArrays } from "./utils"

export type ScaleEncode<T> = (value: T) => Uint8Array
export type ScaleDecode<T> = (decoder: Decoder) => T | ClientError

export interface Decodable<T> {
  decode(decoder: Decoder): T | ClientError
}

export interface Encodable2<T> {
  encode(value: T): Uint8Array
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

export class StorageHasher {
  constructor() {}

  hash(_data: Uint8Array): Uint8Array {
    throw new Error("Not Yet Done")
  }
  fromHash<K>(_key: Encodable2<K>, _data: Uint8Array): K | ClientError {
    throw new Error("Not Yet Done")
  }
}

export function makeStorageMap<K, V>(defaults: {
  PALLET_NAME: string
  STORAGE_NAME: string
  KEY_HASHER: StorageHasher
  decodeKey(decoder: Decoder): K | ClientError
  encodeKey(key: K): Uint8Array
  decodeValue(decoder: Decoder): V | ClientError
}) {
  abstract class Base {
    static PALLET_NAME: string = defaults.PALLET_NAME
    static STORAGE_NAME: string = defaults.STORAGE_NAME
    static KEY_HASHER: StorageHasher = defaults.KEY_HASHER

    static decodeKey(decoder: Decoder): K | ClientError {
      return defaults.decodeKey(decoder)
    }

    static encodeKey(key: K): Uint8Array {
      return defaults.encodeKey(key)
    }

    static decodeValue(decoder: Decoder): V | ClientError {
      return defaults.decodeValue(decoder)
    }

    static encodePartialKey(): Uint8Array {
      const a = xxhashAsU8a(stringToU8a(Base.PALLET_NAME), 128)
      const b = xxhashAsU8a(stringToU8a(Base.STORAGE_NAME), 128)
      return u8aConcat(a, b)
    }

    static encodeStorageKey(key: K): Uint8Array {
      const partialKey = Base.encodePartialKey()
      const encodedKey = Base.encodeKey(key)

      // TODO
      //const encodedKeyHashed = key.encode()
      return u8aConcat(partialKey, encodedKey)
    }

    static decodeStorageValue(encodedValue: Uint8Array): V | ClientError {
      const partialKey = Base.encodePartialKey()
      return Base.decodeValue(new Decoder(encodedValue))
    }

    static fetch(key: K, _at?: H256): V | null | ClientError {
      const storageKey = Hex.encode(Base.encodeStorageKey(key))
      // get storage TODO
      const storageEncodedValue = new Uint8Array()
      // Decode storage
      return Base.decodeValue(new Decoder(storageEncodedValue))
    }
  }
  return Base
}

// export interface IStorageMap<K, V> {
//   palletStorageName(): [string, string]
//   keyHasher(): StorageHasher
//   decodeKey(value: Decoder): K | ClientError
//   encodeKey(value: K): Uint8Array
//   decodeValue(value: Decoder): V | ClientError
// }

// export class StorageMap {
//   static encodePartialKey<K, V>(T: IStorageMap<K, V>): Uint8Array {
//     const [palletName, storageName] = T.palletStorageName();
//     const a = xxhashAsU8a(stringToU8a(palletName), 128)
//     const b = xxhashAsU8a(stringToU8a(storageName), 128)
//     return u8aConcat(a, b)
//   }

//   static encodeStorageKey<K, V>(T: IStorageMap<K, V>, key: K): Uint8Array {
//     const partialKey = StorageMap.encodePartialKey(T)
//     const encodedKey = T.encodeKey(key)

//     // TODO
//     //const encodedKeyHashed = key.encode()
//     return u8aConcat(partialKey, encodedKey)
//   }

//   static decodeStorageValue<K, V>(T: IStorageMap<K, V>, encodedValue: Uint8Array): V | ClientError {
//     const partialKey = StorageMap.encodePartialKey(T)
//     return T.decodeValue(new Decoder(encodedValue))
//   }

//   static fetch<K, V>(T: IStorageMap<K, V>, key: K, _at?: H256): V | null | ClientError {
//     const storageKey = Hex.encode(StorageMap.encodeStorageKey(T, key))
//     // get storage TODO
//     const storageEncodedValue = new Uint8Array()
//     // Decode storage
//     return T.decodeValue(new Decoder(storageEncodedValue))
//   }
// }
