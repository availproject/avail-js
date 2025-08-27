import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { AccountId, DispatchFeeModifier, H256 } from "./../metadata"
import { Bool, CompactU32, U32, VecU8 } from "../scale/types"
import { StorageHasher, addHeader, makeStorageDoubleMap, makeStorageMap, makeStorageValue } from "../../interface"
import { u8aConcat } from "../polkadot"

export const PALLET_NAME: string = "dataAvailability"
export const PALLET_ID: number = 29

export namespace types {
  export class ValidatorPrefs {
    constructor(
      public commission: number, // Compact u32
      public blocked: boolean,
    ) {}

    static decode(decoder: Decoder): ValidatorPrefs | ClientError {
      const value = decoder.any2(CompactU32, Bool)
      if (value instanceof ClientError) return value

      return new ValidatorPrefs(...value)
    }

    static encode(value: ValidatorPrefs): Uint8Array {
      return value.encode()
    }

    encode(): Uint8Array {
      return Encoder.concat(new CompactU32(this.commission), new Bool(this.blocked))
    }
  }
}
