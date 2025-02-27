import { QueryableStorage } from "@polkadot/api/types"
import { Decoder } from "./../../decoder"
import { AccountId } from "../../."

export class Key {
  static async fetch(storageAt: QueryableStorage<"promise">): Promise<AccountId | null> {
    const storage = await storageAt.sudo.key()
    const decoder = new Decoder(storage.toU8a(true), 0)
    if (decoder.len() == 0) {
      return null
    }

    return AccountId.decode(decoder)
  }
}
