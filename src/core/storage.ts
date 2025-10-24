import { AvailError } from "./misc/error"
import { getKeysPaged, getStorage } from "./rpc/state"
import { H256 } from "./metadata"
import { Decoder } from "./scale/decoder"
import { hexDecode, hexEncode } from "./misc/utils"
import type {
  IStorageDoubleMap,
  IStorageDoubleMapIterator,
  IStorageMap,
  IStorageMapIterator,
  IStorageValue,
} from "./interface"

export class StorageValue {
  static async fetch<V>(as: IStorageValue<V>, endpoint: string, at?: H256): Promise<V | null | AvailError> {
    const storageKey = hexEncode(as.encodeStorageKey())
    const storageValue = await getStorage(endpoint, storageKey, at)
    if (storageValue instanceof AvailError) return storageValue
    if (storageValue == null) return null

    // Decode storage
    return as.decodeValue(new Decoder(storageValue))
  }
}

export class StorageMap {
  static async fetch<V, K>(as: IStorageMap<V, K>, endpoint: string, key: K, at?: H256): Promise<V | null | AvailError> {
    const storageKey = hexEncode(as.encodeStorageKey(key))
    const storageValue = await getStorage(endpoint, storageKey, at)
    if (storageValue instanceof AvailError) return storageValue
    if (storageValue == null) return null

    // Decode storage
    return as.decodeValue(new Decoder(storageValue))
  }

  static iter<V, K>(as: IStorageMapIterator<V, K>, endpoint: string, blockHash: H256): StorageMapIterator<V, K> {
    return new StorageMapIterator(as, endpoint, blockHash)
  }
}

export class StorageDoubleMap {
  static async fetch<V, K1, K2>(
    as: IStorageDoubleMap<V, K1, K2>,
    endpoint: string,
    key1: K1,
    key2: K2,
    at?: H256,
  ): Promise<V | null | AvailError> {
    const storageKey = hexEncode(as.encodeStorageKey(key1, key2))
    const storageValue = await getStorage(endpoint, storageKey, at)
    if (storageValue instanceof AvailError) return storageValue
    if (storageValue == null) return null

    // Decode storage
    return as.decodeValue(new Decoder(storageValue))
  }

  static iter<V, K1, K2>(
    as: IStorageDoubleMapIterator<V, K1, K2>,
    key1: K1,
    endpoint: string,
    blockHash: H256,
  ): StorageDoubleMapIterator<V, K1, K2> {
    return new StorageDoubleMapIterator(as, key1, endpoint, blockHash)
  }
}

export class StorageMapIterator<V, K> {
  endpoint: string
  blockHash: H256
  fetchedKeys: string[] = []
  lastKey: string | null = null
  isDone: boolean = false
  prefix: string
  type: IStorageMapIterator<V, K>

  constructor(type: IStorageMapIterator<V, K>, endpoint: string, blockHash: H256) {
    this.endpoint = endpoint
    this.blockHash = blockHash
    this.prefix = hexEncode(type.encodePartialKey())
    this.type = type
  }

  async nextKeyValue(): Promise<[K, V] | null | AvailError> {
    if (this.isDone) {
      return null
    }

    if (this.fetchedKeys.length == 0) {
      const result = await this.fetchNewKeys()
      if (result instanceof AvailError) return result

      if (this.isDone) {
        return null
      }
    }

    const storageKey = this.fetchedKeys[this.fetchedKeys.length - 1]
    const storageValue = await this.fetchStorageValue(storageKey)
    if (storageValue instanceof AvailError) return storageValue
    if (storageValue == null) return null

    const encodedStorageKey = hexDecode(storageKey)
    if (encodedStorageKey instanceof AvailError) return encodedStorageKey

    const decodedStorageKey = this.type.decodeStorageKey(encodedStorageKey)
    if (decodedStorageKey instanceof AvailError) return decodedStorageKey

    this.lastKey = storageKey
    this.fetchedKeys.pop()

    return [decodedStorageKey, storageValue]
  }

  async next(): Promise<V | null | AvailError> {
    if (this.isDone) {
      return null
    }

    if (this.fetchedKeys.length == 0) {
      const result = await this.fetchNewKeys()
      if (result instanceof AvailError) return result

      if (this.fetchedKeys.length == 0) {
        return null
      }
    }

    const storageKey = this.fetchedKeys[this.fetchedKeys.length - 1]
    const storageValue = await this.fetchStorageValue(storageKey)
    if (storageValue instanceof AvailError) return storageValue
    if (storageValue == null) return null

    this.lastKey = storageKey
    this.fetchedKeys.pop()

    return storageValue
  }

  private async fetchNewKeys(): Promise<null | AvailError> {
    const fetchedKeys = await getKeysPaged(this.endpoint, this.prefix, 100, this.lastKey, this.blockHash)
    if (fetchedKeys instanceof AvailError) return fetchedKeys
    this.fetchedKeys = fetchedKeys
    this.fetchedKeys.reverse()
    if (this.fetchedKeys.length == 0) {
      this.isDone = true
    }

    return null
  }

  private async fetchStorageValue(key: string): Promise<V | null | AvailError> {
    const storageValue = await getStorage(this.endpoint, key, this.blockHash)
    if (storageValue instanceof AvailError) return storageValue
    if (storageValue == null) return storageValue

    return this.type.decodeStorageValue(storageValue)
  }
}

export class StorageDoubleMapIterator<V, K1, K2> {
  endpoint: string
  blockHash: H256
  fetchedKeys: string[] = []
  lastKey: string | null = null
  isDone: boolean = false
  prefix: string
  type: IStorageDoubleMapIterator<V, K1, K2>

  constructor(type: IStorageDoubleMapIterator<V, K1, K2>, key1: K1, endpoint: string, blockHash: H256) {
    this.endpoint = endpoint
    this.blockHash = blockHash
    this.prefix = hexEncode(type.encodePartialKey(key1))
    this.type = type
  }

  async nextKeyValue(): Promise<[K1, K2, V] | null | AvailError> {
    if (this.isDone) {
      return null
    }

    if (this.fetchedKeys.length == 0) {
      const result = await this.fetchNewKeys()
      if (result instanceof AvailError) return result

      if (this.isDone) {
        return null
      }
    }

    const storageKey = this.fetchedKeys[this.fetchedKeys.length - 1]
    const storageValue = await this.fetchStorageValue(storageKey)
    if (storageValue instanceof AvailError) return storageValue
    if (storageValue == null) return null

    const encodedStorageKey = hexDecode(storageKey)
    if (encodedStorageKey instanceof AvailError) return encodedStorageKey

    const decodedStorageKey = this.type.decodeStorageKey(encodedStorageKey)
    if (decodedStorageKey instanceof AvailError) return decodedStorageKey

    this.lastKey = storageKey
    this.fetchedKeys.pop()

    return [decodedStorageKey[0], decodedStorageKey[1], storageValue]
  }

  async next(): Promise<V | null | AvailError> {
    if (this.isDone) {
      return null
    }

    if (this.fetchedKeys.length == 0) {
      const result = await this.fetchNewKeys()
      if (result instanceof AvailError) return result

      if (this.fetchedKeys.length == 0) {
        return null
      }
    }

    const storageKey = this.fetchedKeys[this.fetchedKeys.length - 1]
    const storageValue = await this.fetchStorageValue(storageKey)
    if (storageValue instanceof AvailError) return storageValue
    if (storageValue == null) return null

    this.lastKey = storageKey
    this.fetchedKeys.pop()

    return storageValue
  }

  private async fetchNewKeys(): Promise<null | AvailError> {
    const fetchedKeys = await getKeysPaged(this.endpoint, this.prefix, 100, this.lastKey, this.blockHash)
    if (fetchedKeys instanceof AvailError) return fetchedKeys
    this.fetchedKeys = fetchedKeys
    this.fetchedKeys.reverse()
    if (this.fetchedKeys.length == 0) {
      this.isDone = true
    }

    return null
  }

  private async fetchStorageValue(key: string): Promise<V | null | AvailError> {
    const storageValue = await getStorage(this.endpoint, key, this.blockHash)
    if (storageValue instanceof AvailError) return storageValue
    if (storageValue == null) return storageValue

    return this.type.decodeStorageValue(storageValue)
  }
}
