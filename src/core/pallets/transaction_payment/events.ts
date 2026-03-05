import { addHeader } from "./../../interface"
import { AccountId } from "./../../types"
import { Decoder, U128 } from "./../../scale"
import { BN, u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"
import { AccountIdScale } from "../../scale/types"

export class TransactionFeePaid extends addHeader(PALLET_ID, 0) {
  constructor(
    public who: AccountId,
    public actualFee: BN,
    public tip: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransactionFeePaid {
    const result = decoder.any3(AccountIdScale, U128, U128)
    return new TransactionFeePaid(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(AccountIdScale.encode(this.who), U128.encode(this.actualFee), U128.encode(this.tip))
  }
}
