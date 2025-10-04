import { addHeader } from "./../../interface"
import { Encoder, Decoder, VecU8 } from "./../../scale"
import { AvailError } from "../../misc/error"
import { PALLET_ID } from "./header"
import { H256 } from "../../metadata"

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

  static decode(decoder: Decoder): SetKeys | AvailError {
    const value = decoder.any5(H256, H256, H256, H256, VecU8)
    if (value instanceof AvailError) return value

    return new SetKeys(...value)
  }

  encode(): Uint8Array {
    return Encoder.concat(this.babe, this.grandpa, this.authorityDiscovery, this.imOnline, new VecU8(this.proof))
  }
}

export class PurgeKeys extends addHeader(PALLET_ID, 1) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): PurgeKeys | AvailError {
    return new PurgeKeys()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}
