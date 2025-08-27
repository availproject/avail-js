import ClientError from "../../../error"
import { AccountId, H256 } from "./../../metadata"
import { U32, VecU8, Encoder, Decoder } from "../../scale"
import { addHeader } from "../../../interface"
import { u8aConcat } from "../../polkadot"
import { PALLET_ID } from "."

export class ApplicationKeyCreated extends addHeader(PALLET_ID, 0) {
  constructor(
    public key: Uint8Array,
    public owner: AccountId,
    public id: number, // u32
  ) {
    super()
  }

  static decode(decoder: Decoder): ApplicationKeyCreated | ClientError {
    const result = decoder.any3(VecU8, AccountId, U32)
    if (result instanceof ClientError) return result

    return new ApplicationKeyCreated(result[0], result[1], result[2])
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.vecU8(this.key), Encoder.any1(this.owner), Encoder.u32(this.id))
  }
}

export class DataSubmitted extends addHeader(PALLET_ID, 1) {
  constructor(
    public who: AccountId,
    public dataHash: H256,
  ) {
    super()
  }

  static decode(decoder: Decoder): DataSubmitted | ClientError {
    const result = decoder.any2(AccountId, H256)
    if (result instanceof ClientError) return result

    return new DataSubmitted(result[0], result[1])
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(this.who), Encoder.any1(this.dataHash))
  }
}
