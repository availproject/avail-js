import { QueryableStorage } from "@polkadot/api/types"
import { Decoder, Hasher, partiallyDecodeKey } from "./../../decoder"
import { AccountId } from "../../.";

export class NextAppId {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<number> {
    const storage = await storageAt.dataAvailability.nextAppId()
    const decoder = new Decoder(storage.toU8a(), 0)
    return decoder.decodeU32(true)
  }
}

export interface AppKeysEntry { key: Uint8Array, value: AppKeys }
export class AppKeys {
  public owner: AccountId
  public appId: number

  constructor(decoder: Decoder) {
    this.owner = AccountId.decode(decoder)
    this.appId = decoder.decodeU32(true)
  }

  static HASHER: Hasher = Hasher.BLAKE2_128_CONCAT

  static async fetch(storageAt: QueryableStorage<'promise'>, key: Uint8Array | string): Promise<AppKeysEntry | null> {
    key = key instanceof Uint8Array ? key : new TextEncoder().encode(key)
    const storage = await storageAt.dataAvailability.appKeys(new TextDecoder().decode(key))
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return null
    }
    return { key: key, value: new AppKeys(decoder) }
  }

  static async fetchAll(storageAt: QueryableStorage<'promise'>): Promise<AppKeysEntry[]> {
    const result = []
    const entries = await storageAt.dataAvailability.appKeys.entries()
    for (const [encodedKey, value] of entries) {
      const keyArray = partiallyDecodeKey(encodedKey.buffer, this.HASHER)
      const key = keyArray

      const decoder = new Decoder(value.toU8a(true), 0)
      if (decoder.len() == 0) {
        continue
      }
      result.push({ key: key, value: new AppKeys(decoder) })
    }
    return result
  }
}