import { QueryableStorage } from "@polkadot/api/types"
import { Decoder, Hasher, partiallyDecodeKey } from "./../../decoder"
import { H256, Metadata } from "../../."
import { PerDispatchClassU32, Weight } from "../../metadata"

export interface AccountEntry {
  key: Metadata.AccountId
  value: Account
}
export class Account {
  public nonce: number
  public consumers: number
  public providers: number
  public sufficients: number
  public accountData: Metadata.AccountData

  constructor(decoder: Decoder) {
    this.nonce = decoder.decodeU32()
    this.consumers = decoder.decodeU32()
    this.providers = decoder.decodeU32()
    this.sufficients = decoder.decodeU32()
    this.accountData = new Metadata.AccountData(decoder)
  }

  static HASHER: Hasher = Hasher.BLAKE2_128_CONCAT

  static async fetch(storageAt: QueryableStorage<"promise">, key: Metadata.AccountId | string): Promise<AccountEntry> {
    const realKey = key instanceof Metadata.AccountId ? key : Metadata.AccountId.fromSS58(key)
    const storage = await storageAt.system.account(realKey.toSS58())
    const decoder = new Decoder(storage.toU8a(true), 0)
    return { key: realKey, value: new Account(decoder) }
  }

  static async fetchAll(storageAt: QueryableStorage<"promise">): Promise<AccountEntry[]> {
    const result = []
    const entries = await storageAt.system.account.entries()
    for (const [encodedKey, value] of entries) {
      const keyArray = partiallyDecodeKey(encodedKey.buffer, this.HASHER)
      const key = new Metadata.AccountId(keyArray)

      const decoder = new Decoder(value.toU8a(true), 0)
      result.push({ key: key, value: new Account(decoder) })
    }
    return result
  }
}

export interface BlockHasEntry {
  key: number
  value: H256
}
export class BlockHash {
  static HASHER: Hasher = Hasher.TWOX64_CONCAT

  static async fetch(storageAt: QueryableStorage<"promise">, key: number): Promise<BlockHasEntry> {
    const storage = await storageAt.system.blockHash(key)
    return { key, value: new H256(storage.toU8a()) }
  }

  static async fetchAll(storageAt: QueryableStorage<"promise">): Promise<BlockHasEntry[]> {
    const result = []
    const entries = await storageAt.system.blockHash.entries()
    for (const [encodedKey, value] of entries) {
      const keyArray = partiallyDecodeKey(encodedKey.buffer, this.HASHER)
      const key = new Decoder(keyArray, 0).decodeU32()

      result.push({ key: key, value: new H256(value.toU8a(true)) })
    }
    return result
  }
}

export class BlockWeight {
  public normal: Weight
  public operational: Weight
  public mandatory: Weight

  constructor(decoder: Decoder) {
    this.normal = new Weight(decoder)
    this.operational = new Weight(decoder)
    this.mandatory = new Weight(decoder)
  }

  static async fetch(storageAt: QueryableStorage<"promise">): Promise<BlockWeight> {
    const storage = await storageAt.system.blockWeight()
    const decoder = new Decoder(storage.toU8a(true), 0)
    return new BlockWeight(decoder)
  }
}

export class DynamicBlockLength {
  public max: PerDispatchClassU32
  public cols: number
  public rows: number
  public chunkSize: number

  constructor(decoder: Decoder) {
    this.max = new PerDispatchClassU32(decoder)
    this.cols = decoder.decodeU32(true)
    this.rows = decoder.decodeU32(true)
    this.chunkSize = decoder.decodeU32(true)
  }

  static async fetch(storageAt: QueryableStorage<"promise">): Promise<DynamicBlockLength> {
    const storage = await storageAt.system.dynamicBlockLength()
    const decoder = new Decoder(storage.toU8a(true), 0)
    return new DynamicBlockLength(decoder)
  }
}

export class EventCount {
  static async fetch(storageAt: QueryableStorage<"promise">): Promise<number> {
    const storage = await storageAt.system.eventCount()
    const decoder = new Decoder(storage.toU8a(true), 0)
    return decoder.decodeU32()
  }
}

export class ExtrinsicCount {
  static async fetch(storageAt: QueryableStorage<"promise">): Promise<number | null> {
    const storage = await storageAt.system.extrinsicCount()
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return null
    }

    return decoder.decodeU32()
  }
}

export class Number {
  static async fetch(storageAt: QueryableStorage<"promise">): Promise<number> {
    const storage = await storageAt.system.number()
    const decoder = new Decoder(storage.toU8a(true), 0)
    return decoder.decodeU32()
  }
}

export class ParentHash {
  static async fetch(storageAt: QueryableStorage<"promise">): Promise<H256> {
    const storage = await storageAt.system.parentHash()
    const decoder = new Decoder(storage.toU8a(true), 0)
    return H256.decode(decoder)
  }
}
