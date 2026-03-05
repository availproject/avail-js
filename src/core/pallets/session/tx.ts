import { addHeader } from "./../../interface"
import { Encoder, Decoder, VecU8 } from "./../../scale"
import { PALLET_ID } from "./header"
import { H256 } from "../../types"
import { H256Scale } from "../../scale/types"

export { PALLET_ID }

export class SetKeys extends addHeader(PALLET_ID, 0) {
  constructor(
    public babe: H256,
    public grandpa: H256,
    public imOnline: H256,
    public authorityDiscovery: H256,
    public proof: Uint8Array /*Vec<u8> */,
  ) {
    super()
  }

  static decode(decoder: Decoder): SetKeys {
    const value = decoder.any5(H256Scale, H256Scale, H256Scale, H256Scale, VecU8)

    return new SetKeys(...value)
  }

  encode(): Uint8Array {
    return Encoder.concat(
      new H256Scale(this.babe),
      new H256Scale(this.grandpa),
      new H256Scale(this.authorityDiscovery),
      new H256Scale(this.imOnline),
      new VecU8(this.proof),
    )
  }
}

export class PurgeKeys extends addHeader(PALLET_ID, 1) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): PurgeKeys {
    return new PurgeKeys()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}
