import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { CompactU32 } from "../scale/types"

export const PALLET_NAME: string = "vector"
export const PALLET_INDEX: number = 39

export namespace tx {
  export class FailedSendMessageTxs {
    constructor(public failedTxs: number[]) {}
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "failedSendMessageTxs"

    encode(): Uint8Array {
      return Encoder.vec(this.failedTxs.map((x) => new CompactU32(x)))
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 11]
    }

    dispatchIndex(): [number, number] {
      return FailedSendMessageTxs.dispatchIndex()
    }

    static decode(decoder: Decoder): FailedSendMessageTxs | ClientError {
      const value = decoder.vec(CompactU32)
      if (value instanceof ClientError) return value

      return new FailedSendMessageTxs(value)
    }
  }
}
