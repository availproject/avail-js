import { BN } from "./../polkadot"
import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { makeStorageValue } from "../../interface"

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
  export class Set {
    constructor(public now: BN) {}
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "set"

    encode(): Uint8Array {
      return Encoder.u64(this.now, true)
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 0]
    }

    dispatchIndex(): [number, number] {
      return Set.dispatchIndex()
    }

    static decode(decoder: Decoder): Set | ClientError {
      const value = decoder.u64(true)
      if (value instanceof ClientError) return value

      return new Set(value)
    }
  }
}
