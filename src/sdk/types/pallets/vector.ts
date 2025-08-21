import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { CompactU32 } from "../scale/types"
import { addPalletInfo } from "../../interface"

export const PALLET_NAME: string = "vector"
export const PALLET_INDEX: number = 39

export namespace tx {
  export class FailedSendMessageTxs extends addPalletInfo(PALLET_INDEX, 11) {
    constructor(public failedTxs: number[]) {
      super()
    }
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "failedSendMessageTxs"

    encode(): Uint8Array {
      return Encoder.vec(this.failedTxs.map((x) => new CompactU32(x)))
    }

    static decode(decoder: Decoder): FailedSendMessageTxs | ClientError {
      const value = decoder.vec(CompactU32)
      if (value instanceof ClientError) return value

      return new FailedSendMessageTxs(value)
    }
  }
}
