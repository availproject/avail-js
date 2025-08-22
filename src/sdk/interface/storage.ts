import ClientError from "../error"
import { H256 } from "../types"
import { stringToU8a, u8aConcat, xxhashAsU8a } from "../types/polkadot"
import { Decoder } from "../types/scale"
import { Hex } from "../utils"

export type StorageHasherValue =
  | "Blake2_128"
  | "Blake2_256"
  | "Blake2_128Concat"
  | "Twox128"
  | "Twox256"
  | "Twox64Concat"
  | "Identity"
export class StorageHasher {
  constructor(public value: StorageHasherValue) {}

  hash(_data: Uint8Array): Uint8Array {
    throw new Error("Not Yet Done")
  }
  fromHash<K>(_decodeKey: (decoder: Decoder) => K | ClientError, _decoder: Decoder): K | ClientError {
    throw new Error("Not Yet Done")
  }
}

export function twoX128(value: Uint8Array): Uint8Array {
  return xxhashAsU8a(value, 128)
}

export function makeStorageValue<V>(defaults: {
  PALLET_NAME: string
  STORAGE_NAME: string
  decodeValue(decoder: Decoder): V | ClientError
}) {
  abstract class Base {
    static PALLET_NAME: string = defaults.PALLET_NAME
    static STORAGE_NAME: string = defaults.STORAGE_NAME
    PALLET_NAME: string = defaults.PALLET_NAME
    STORAGE_NAME: string = defaults.STORAGE_NAME

    static decodeValue(decoder: Decoder): V | ClientError {
      return defaults.decodeValue(decoder)
    }

    static encodeStorageKey(): Uint8Array {
      const a = twoX128(stringToU8a(Base.PALLET_NAME))
      const b = twoX128(stringToU8a(Base.STORAGE_NAME))
      return u8aConcat(a, b)
    }

    static hexEncodeStorageKey(): string {
      return Hex.encode(Base.encodeStorageKey())
    }

    static decodeStorageValue(encodedValue: Uint8Array): V | ClientError {
      return Base.decodeValue(new Decoder(encodedValue))
    }

    static decodeHexStorageValue(encodedValue: string): V | ClientError {
      const value = Hex.decode(encodedValue)
      if (value instanceof ClientError) return value

      return Base.decodeStorageValue(value)
    }

    static fetch(_at?: H256): V | null | ClientError {
      const storageKey = Hex.encode(Base.encodeStorageKey())
      // get storage TODO
      const storageEncodedValue = new Uint8Array()
      // Decode storage
      return Base.decodeValue(new Decoder(storageEncodedValue))
    }
  }
  return Base
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
    PALLET_NAME: string = defaults.PALLET_NAME
    STORAGE_NAME: string = defaults.STORAGE_NAME
    KEY_HASHER: StorageHasher = defaults.KEY_HASHER

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
      const a = twoX128(stringToU8a(Base.PALLET_NAME))
      const b = twoX128(stringToU8a(Base.STORAGE_NAME))
      return u8aConcat(a, b)
    }

    static hexEncodePartialStorageKey(): string {
      return Hex.encode(Base.encodePartialKey())
    }

    static encodeStorageKey(key: K): Uint8Array {
      const partialKey = Base.encodePartialKey()
      const encodedKey = Base.encodeKey(key)
      return u8aConcat(partialKey, Base.KEY_HASHER.hash(encodedKey))
    }

    static hexEncodeStorageKey(key: K): string {
      return Hex.encode(Base.encodeStorageKey(key))
    }

    static decodeStorageKey(encodedKey: Uint8Array): K | ClientError {
      if (encodedKey.length < 32) return new ClientError("Storage key is malformed. Has less than 32 bytes")

      const data = encodedKey.slice(32)
      return Base.KEY_HASHER.fromHash(Base.decodeKey, new Decoder(data))
    }

    static decodeHexStorageKey(encodedValue: string): K | ClientError {
      const value = Hex.decode(encodedValue)
      if (value instanceof ClientError) return value

      return Base.decodeStorageKey(value)
    }

    static decodeStorageValue(encodedValue: Uint8Array): V | ClientError {
      return Base.decodeValue(new Decoder(encodedValue))
    }

    static decodeHexStorageValue(encodedValue: string): V | ClientError {
      const value = Hex.decode(encodedValue)
      if (value instanceof ClientError) return value

      return Base.decodeStorageValue(value)
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

export function makeStorageDoubleMap<K1, K2, V>(defaults: {
  PALLET_NAME: string
  STORAGE_NAME: string
  KEY1_HASHER: StorageHasher
  KEY2_HASHER: StorageHasher
  decodeKey1(decoder: Decoder): K1 | ClientError
  encodeKey1(key: K1): Uint8Array
  decodeKey2(decoder: Decoder): K2 | ClientError
  encodeKey2(key: K2): Uint8Array
  decodeValue(decoder: Decoder): V | ClientError
}) {
  abstract class Base {
    static PALLET_NAME: string = defaults.PALLET_NAME
    static STORAGE_NAME: string = defaults.STORAGE_NAME
    static KEY1_HASHER: StorageHasher = defaults.KEY1_HASHER
    static KEY2_HASHER: StorageHasher = defaults.KEY2_HASHER
    PALLET_NAME: string = defaults.PALLET_NAME
    STORAGE_NAME: string = defaults.STORAGE_NAME
    KEY1_HASHER: StorageHasher = defaults.KEY1_HASHER
    KEY2_HASHER: StorageHasher = defaults.KEY2_HASHER

    static decodeKey1(decoder: Decoder): K1 | ClientError {
      return defaults.decodeKey1(decoder)
    }

    static encodeKey1(key: K1): Uint8Array {
      return defaults.encodeKey1(key)
    }

    static decodeKey2(decoder: Decoder): K2 | ClientError {
      return defaults.decodeKey2(decoder)
    }

    static encodeKey2(key: K2): Uint8Array {
      return defaults.encodeKey2(key)
    }

    static decodeValue(decoder: Decoder): V | ClientError {
      return defaults.decodeValue(decoder)
    }

    static encodePartialKey(key1: K1): Uint8Array {
      const a = twoX128(stringToU8a(Base.PALLET_NAME))
      const b = twoX128(stringToU8a(Base.STORAGE_NAME))
      const c = Base.KEY1_HASHER.hash(Base.encodeKey1(key1))
      return u8aConcat(a, b, c)
    }

    static hexEncodePartialStorageKey(key1: K1): string {
      return Hex.encode(Base.encodePartialKey(key1))
    }

    static encodeStorageKey(key1: K1, key2: K2): Uint8Array {
      const a = Base.encodePartialKey(key1)
      const b = Base.KEY2_HASHER.hash(Base.encodeKey2(key2))
      return u8aConcat(a, b)
    }

    static hexEncodeStorageKey(key1: K1, key2: K2): string {
      return Hex.encode(Base.encodeStorageKey(key1, key2))
    }

    static decodePartialKey(encodedKey: Uint8Array): K1 | ClientError {
      if (encodedKey.length < 32) return new ClientError("Storage key is malformed. Has less than 32 bytes")

      const data = encodedKey.slice(32)
      return Base.KEY1_HASHER.fromHash(Base.decodeKey1, new Decoder(data))
    }

    static decodeStorageKey(encodedKey: Uint8Array): [K1, K2] | ClientError {
      if (encodedKey.length < 32) return new ClientError("Storage key is malformed. Has less than 32 bytes")

      const data = encodedKey.slice(32)
      const decoder = new Decoder(data)

      const key1 = Base.KEY1_HASHER.fromHash(Base.decodeKey1, decoder)
      if (key1 instanceof ClientError) return key1
      const key2 = Base.KEY2_HASHER.fromHash(Base.decodeKey2, decoder)
      if (key2 instanceof ClientError) return key2

      return [key1, key2]
    }

    static decodeHexStorageKey(encodedValue: string): [K1, K2] | ClientError {
      const value = Hex.decode(encodedValue)
      if (value instanceof ClientError) return value

      return Base.decodeStorageKey(value)
    }

    static decodeStorageValue(encodedValue: Uint8Array): V | ClientError {
      return Base.decodeValue(new Decoder(encodedValue))
    }

    static decodeHexStorageValue(encodedValue: string): V | ClientError {
      const value = Hex.decode(encodedValue)
      if (value instanceof ClientError) return value

      return Base.decodeStorageValue(value)
    }

    static fetch(key1: K1, key2: K2, _at?: H256): V | null | ClientError {
      const storageKey = Hex.encode(Base.encodeStorageKey(key1, key2))
      // get storage TODO
      const storageEncodedValue = new Uint8Array()
      // Decode storage
      return Base.decodeValue(new Decoder(storageEncodedValue))
    }
  }
  return Base
}
