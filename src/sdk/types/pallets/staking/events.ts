import { ClientError } from "../../../error"
import { AccountId } from "../../metadata"
import { addHeader } from "../../../interface"
import { Decoder, U128 } from "../../scale"
import { PALLET_ID } from "."
import { BN } from "../../polkadot"

/// A proxy was executed correctly, with the given.
export class Bonded extends addHeader(PALLET_ID, 6) {
  constructor(
    public stash: AccountId,
    public amount: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): Bonded | ClientError {
    const result = decoder.any2(AccountId, U128)
    if (result instanceof ClientError) return result

    return new Bonded(...result)
  }
}
