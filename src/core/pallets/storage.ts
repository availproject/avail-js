import { AvailError } from "../error"
import { stringToU8a, u8aConcat } from "../polkadot"
import { twoX128, hexDecode, hexEncode } from "../utils"
import { StorageHasher, type StorageHasherValue } from "./../metadata"
import { Decoder } from "./../scale/decoder"

export function makeStorageValue<V>(defaults: {
  PALLET_NAME: string
  STORAGE_NAME: string
  decodeValue(decoder: Decoder): V | AvailError
}) {
  abstract class Base {
    static PALLET_NAME: string = defaults.PALLET_NAME
    static STORAGE_NAME: string = defaults.STORAGE_NAME
    PALLET_NAME: string = defaults.PALLET_NAME
    STORAGE_NAME: string = defaults.STORAGE_NAME

    static decodeValue(decoder: Decoder): V | AvailError {
      return defaults.decodeValue(decoder)
    }

    static encodeStorageKey(): Uint8Array {
      const a = twoX128(stringToU8a(Base.PALLET_NAME))
      const b = twoX128(stringToU8a(Base.STORAGE_NAME))
      return u8aConcat(a, b)
    }

    static hexEncodeStorageKey(): string {
      return hexEncode(Base.encodeStorageKey())
    }

    static decodeStorageValue(encodedValue: Uint8Array): V | AvailError {
      return Base.decodeValue(new Decoder(encodedValue))
    }

    static decodeHexStorageValue(encodedValue: string): V | AvailError {
      const value = hexDecode(encodedValue)
      if (value instanceof AvailError) return value

      return Base.decodeStorageValue(value)
    }
  }
  return Base
}

export function makeStorageMap<K, V>(defaults: {
  PALLET_NAME: string
  STORAGE_NAME: string
  KEY_HASHER: StorageHasherValue
  decodeKey(decoder: Decoder): K | AvailError
  encodeKey(key: K): Uint8Array
  decodeValue(decoder: Decoder): V | AvailError
}) {
  abstract class Base {
    static PALLET_NAME: string = defaults.PALLET_NAME
    static STORAGE_NAME: string = defaults.STORAGE_NAME
    static KEY_HASHER: StorageHasher = new StorageHasher(defaults.KEY_HASHER)
    PALLET_NAME: string = defaults.PALLET_NAME
    STORAGE_NAME: string = defaults.STORAGE_NAME
    KEY_HASHER: StorageHasher = new StorageHasher(defaults.KEY_HASHER)

    static decodeKey(decoder: Decoder): K | AvailError {
      return defaults.decodeKey(decoder)
    }

    static encodeKey(key: K): Uint8Array {
      return defaults.encodeKey(key)
    }

    static decodeValue(decoder: Decoder): V | AvailError {
      return defaults.decodeValue(decoder)
    }

    static encodePartialKey(): Uint8Array {
      const a = twoX128(stringToU8a(Base.PALLET_NAME))
      const b = twoX128(stringToU8a(Base.STORAGE_NAME))
      return u8aConcat(a, b)
    }

    static hexEncodePartialStorageKey(): string {
      return hexEncode(Base.encodePartialKey())
    }

    static encodeStorageKey(key: K): Uint8Array {
      const partialKey = Base.encodePartialKey()
      const encodedKey = Base.encodeKey(key)
      return u8aConcat(partialKey, Base.KEY_HASHER.hash(encodedKey))
    }

    static hexEncodeStorageKey(key: K): string {
      return hexEncode(Base.encodeStorageKey(key))
    }

    static decodeStorageKey(encodedKey: Uint8Array): K | AvailError {
      if (encodedKey.length < 32) return new AvailError("Storage key is malformed. Has less than 32 bytes")

      const data = encodedKey.slice(32)
      return Base.KEY_HASHER.fromHash(Base.decodeKey, new Decoder(data))
    }

    static decodeHexStorageKey(encodedValue: string): K | AvailError {
      const value = hexDecode(encodedValue)
      if (value instanceof AvailError) return value

      return Base.decodeStorageKey(value)
    }

    static decodeStorageValue(encodedValue: Uint8Array): V | AvailError {
      return Base.decodeValue(new Decoder(encodedValue))
    }

    static decodeHexStorageValue(encodedValue: string): V | AvailError {
      const value = hexDecode(encodedValue)
      if (value instanceof AvailError) return value

      return Base.decodeStorageValue(value)
    }
  }
  return Base
}

export function makeStorageDoubleMap<K1, K2, V>(defaults: {
  PALLET_NAME: string
  STORAGE_NAME: string
  KEY1_HASHER: StorageHasherValue
  KEY2_HASHER: StorageHasherValue
  decodeKey1(decoder: Decoder): K1 | AvailError
  encodeKey1(key: K1): Uint8Array
  decodeKey2(decoder: Decoder): K2 | AvailError
  encodeKey2(key: K2): Uint8Array
  decodeValue(decoder: Decoder): V | AvailError
}) {
  abstract class Base {
    static PALLET_NAME: string = defaults.PALLET_NAME
    static STORAGE_NAME: string = defaults.STORAGE_NAME
    static KEY1_HASHER: StorageHasher = new StorageHasher(defaults.KEY1_HASHER)
    static KEY2_HASHER: StorageHasher = new StorageHasher(defaults.KEY2_HASHER)
    PALLET_NAME: string = defaults.PALLET_NAME
    STORAGE_NAME: string = defaults.STORAGE_NAME
    KEY1_HASHER: StorageHasher = new StorageHasher(defaults.KEY1_HASHER)
    KEY2_HASHER: StorageHasher = new StorageHasher(defaults.KEY2_HASHER)

    static decodeKey1(decoder: Decoder): K1 | AvailError {
      return defaults.decodeKey1(decoder)
    }

    static encodeKey1(key: K1): Uint8Array {
      return defaults.encodeKey1(key)
    }

    static decodeKey2(decoder: Decoder): K2 | AvailError {
      return defaults.decodeKey2(decoder)
    }

    static encodeKey2(key: K2): Uint8Array {
      return defaults.encodeKey2(key)
    }

    static decodeValue(decoder: Decoder): V | AvailError {
      return defaults.decodeValue(decoder)
    }

    static encodePartialKey(key1: K1): Uint8Array {
      const a = twoX128(stringToU8a(Base.PALLET_NAME))
      const b = twoX128(stringToU8a(Base.STORAGE_NAME))
      const c = Base.KEY1_HASHER.hash(Base.encodeKey1(key1))
      return u8aConcat(a, b, c)
    }

    static hexEncodePartialStorageKey(key1: K1): string {
      return hexEncode(Base.encodePartialKey(key1))
    }

    static encodeStorageKey(key1: K1, key2: K2): Uint8Array {
      const a = Base.encodePartialKey(key1)
      const b = Base.KEY2_HASHER.hash(Base.encodeKey2(key2))
      return u8aConcat(a, b)
    }

    static hexEncodeStorageKey(key1: K1, key2: K2): string {
      return hexEncode(Base.encodeStorageKey(key1, key2))
    }

    static decodePartialKey(encodedKey: Uint8Array): K1 | AvailError {
      if (encodedKey.length < 32) return new AvailError("Storage key is malformed. Has less than 32 bytes")

      const data = encodedKey.slice(32)
      return Base.KEY1_HASHER.fromHash(Base.decodeKey1, new Decoder(data))
    }

    static decodeStorageKey(encodedKey: Uint8Array): [K1, K2] | AvailError {
      if (encodedKey.length < 32) return new AvailError("Storage key is malformed. Has less than 32 bytes")

      const data = encodedKey.slice(32)
      const decoder = new Decoder(data)

      const key1 = Base.KEY1_HASHER.fromHash(Base.decodeKey1, decoder)
      if (key1 instanceof AvailError) return key1
      const key2 = Base.KEY2_HASHER.fromHash(Base.decodeKey2, decoder)
      if (key2 instanceof AvailError) return key2

      return [key1, key2]
    }

    static decodeHexStorageKey(encodedValue: string): [K1, K2] | AvailError {
      const value = hexDecode(encodedValue)
      if (value instanceof AvailError) return value

      return Base.decodeStorageKey(value)
    }

    static decodeStorageValue(encodedValue: Uint8Array): V | AvailError {
      return Base.decodeValue(new Decoder(encodedValue))
    }

    static decodeHexStorageValue(encodedValue: string): V | AvailError {
      const value = hexDecode(encodedValue)
      if (value instanceof AvailError) return value

      return Base.decodeStorageValue(value)
    }
  }
  return Base
}
