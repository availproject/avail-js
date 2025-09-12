import { BN } from "../../polkadot"
import { Encoder, Decoder } from "../../scale"
import { ClientError } from "../../../error"
import { addHeader } from "../."
import { PALLET_ID } from "."

export class Set extends addHeader(PALLET_ID, 0) {
  constructor(public now: BN) {
    super()
  }

  static decode(decoder: Decoder): Set | ClientError {
    const value = decoder.u64(true)
    if (value instanceof ClientError) return value

    return new Set(value)
  }

  encode(): Uint8Array {
    return Encoder.u64(this.now, true)
  }
}
