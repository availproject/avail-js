import { BN } from "./../polkadot"
import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { addPalletInfo, makeStorageValue } from "../../interface"

export const PALLET_NAME: string = "timestamp"
export const PALLET_INDEX: number = 3

export namespace storage {
  export class Now extends makeStorageValue<BN>({
    PALLET_NAME: "Timestamp",
    STORAGE_NAME: "Now",
    decodeValue: (decoder: Decoder) => decoder.u64(),
  }) {}

  export class DidUpdate extends makeStorageValue<boolean>({
    PALLET_NAME: "Timestamp",
    STORAGE_NAME: "DidUpdate",
    decodeValue: (decoder: Decoder) => decoder.bool(),
  }) {}
}

export namespace tx {
  export class Set extends addPalletInfo(PALLET_INDEX, 0) {
    constructor(public now: BN) {
      super()
    }
    encode(): Uint8Array {
      return Encoder.u64(this.now, true)
    }

    static decode(decoder: Decoder): Set | ClientError {
      const value = decoder.u64(true)
      if (value instanceof ClientError) return value

      return new Set(value)
    }
  }
}
