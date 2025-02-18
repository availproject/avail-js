import { QueryableStorage } from "@polkadot/api/types"
import { Decoder } from "../../decoder"
import { Codec } from "@polkadot/types-codec/types";

export class CurrentIndex {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<number> {
    const value = await storageAt.session.currentIndex()
    const decoder = new Decoder(value.toU8a(true), 0)
    return decoder.decodeU32()
  }
}

export class DisabledValidators {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<number[]> {
    const result: number[] = []
    const value = await storageAt.session.disabledValidators() as unknown as Codec[]
    for (const elem of value) {
      result.push(new Decoder(elem.toU8a(true), 0).decodeU32())
    }

    return result
  }
}
