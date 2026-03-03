import { addHeader } from "./../../interface"
import { BN } from "@polkadot/util"
import { Encoder } from "./../../scale/encoder"
import { Decoder } from "./../../scale/decoder"
import { AvailError } from "../../error"
import { PALLET_ID } from "./header"

export { PALLET_ID }

export class Set extends addHeader(PALLET_ID, 0) {
  constructor(public now: BN) {
    super()
  }

  static decode(decoder: Decoder): Set {
    const value = decoder.u64(true)

    return new Set(value)
  }

  encode(): Uint8Array {
    return Encoder.u64(this.now, true)
  }
}
