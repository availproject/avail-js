import { addHeader } from "./../../interface"
import { AvailError } from "../../error"
import { AccountId } from "./../../metadata"
import { Decoder, U128 } from "./../../scale"
import { BN, u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"

export class TransactionFeePaid extends addHeader(PALLET_ID, 0) {
  constructor(
    public who: AccountId,
    public actualFee: BN,
    public tip: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransactionFeePaid | AvailError {
    const result = decoder.any3(AccountId, U128, U128)
    if (result instanceof AvailError) return result

    return new TransactionFeePaid(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(AccountId.encode(this.who), U128.encode(this.actualFee), U128.encode(this.tip))
  }
}
