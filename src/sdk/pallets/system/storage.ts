import { QueryableStorage } from "@polkadot/api/types"
import { Decoder, HASHER_BLAKE2_128, HASHER_TWOX64_CONCAT, partiallyDecodeKey, uint8ArrayToHex } from "../decoder"
import { AccountData } from "../metadata"
import { AccountId } from "../../account";

export type AccountKey = AccountId
export interface AccountEntry { key: AccountKey, value: Account }
export class Account {
  public nonce: number
  public consumers: number
  public providers: number
  public sufficients: number
  public accountData: AccountData

  constructor(decoder: Decoder) {
    this.nonce = decoder.decodeU32()
    this.consumers = decoder.decodeU32()
    this.providers = decoder.decodeU32()
    this.sufficients = decoder.decodeU32()
    this.accountData = new AccountData(decoder)
  }

  static HASHER: number = HASHER_BLAKE2_128

  static async fetch(storageAt: QueryableStorage<'promise'>, key: AccountKey | string): Promise<AccountEntry> {
    const realKey = key instanceof AccountId ? key : AccountId.fromSS58(key)
    const storage = await storageAt.system.account(realKey.toSS58())
    const decoder = new Decoder(storage.toU8a(), 0)
    return { key: realKey, value: new Account(decoder) }
  }

  static async fetchAll(storageAt: QueryableStorage<'promise'>): Promise<AccountEntry[]> {
    const result = []
    const entries = await storageAt.system.account.entries()
    for (const [encodedKey, value] of entries) {
      const keyArray = partiallyDecodeKey(encodedKey.buffer, this.HASHER)
      const key = new AccountId(keyArray)

      const decoder = new Decoder(value.toU8a(), 0)
      result.push({ key: key, value: new Account(decoder) })
    }
    return result
  }
}


export type BlockHashKey = number
export interface BlockHasEntry { key: BlockHashKey, value: string }
export class BlockHash {
  static HASHER: number = HASHER_TWOX64_CONCAT

  static async fetch(storageAt: QueryableStorage<'promise'>, key: BlockHashKey): Promise<BlockHasEntry> {
    const storage = await storageAt.system.blockHash(key)
    return { key, value: uint8ArrayToHex(storage.toU8a()) }
  }

  static async fetchAll(storageAt: QueryableStorage<'promise'>): Promise<BlockHasEntry[]> {
    const result = []
    const entries = await storageAt.system.blockHash.entries()
    for (const [encodedKey, value] of entries) {
      const keyArray = partiallyDecodeKey(encodedKey.buffer, this.HASHER)
      const key = new Decoder(keyArray, 0).decodeU32()

      result.push({ key: key, value: uint8ArrayToHex(value.toU8a()) })
    }
    return result
  }
}