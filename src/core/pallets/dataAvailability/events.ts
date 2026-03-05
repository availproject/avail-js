import { addHeader } from "./../../interface"
import { AccountId, H256 } from "./../../types"
import { VecU8, Encoder, Decoder, CompactU32 } from "./../../scale"
import { u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"
import { AccountIdScale, H256Scale } from "../../scale/types"

export class ApplicationKeyCreated extends addHeader(PALLET_ID, 0) {
  constructor(
    public key: Uint8Array,
    public owner: AccountId,
    public id: number, // Compact<u32>
  ) {
    super()
  }

  static decode(decoder: Decoder): ApplicationKeyCreated {
    const result = decoder.any3(VecU8, AccountIdScale, CompactU32)

    return new ApplicationKeyCreated(result[0], result[1], result[2])
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.vecU8(this.key), Encoder.any1(new AccountIdScale(this.owner)), Encoder.u32(this.id))
  }
}

export class DataSubmitted extends addHeader(PALLET_ID, 1) {
  constructor(
    public who: AccountId,
    public dataHash: H256,
  ) {
    super()
  }

  static decode(decoder: Decoder): DataSubmitted {
    const result = decoder.any2(AccountIdScale, H256Scale)

    return new DataSubmitted(result[0], result[1])
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(new AccountIdScale(this.who)), Encoder.any1(new H256Scale(this.dataHash)))
  }
}
