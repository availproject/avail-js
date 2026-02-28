import { addHeader } from "./../../interface"
import { AvailError } from "../../error"
import { Decoder, U128 } from "./../../scale"
import { BN, u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"

export class UpdatedInactive extends addHeader(PALLET_ID, 8) {
  constructor(
    public reactivated: BN,
    public deactivated: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): UpdatedInactive | AvailError {
    const result = decoder.any2(U128, U128)
    if (result instanceof AvailError) return result

    return new UpdatedInactive(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(U128.encode(this.reactivated), U128.encode(this.deactivated))
  }
}
