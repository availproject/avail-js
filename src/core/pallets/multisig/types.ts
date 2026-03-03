import { Encoder, Decoder } from "./../../scale"
import { AvailError } from "../../error"
import { u8aConcat } from "@polkadot/util"

export class Timepoint {
  constructor(
    public height: number, // u32
    public index: number, // u32
  ) {}

  static decode(decoder: Decoder): Timepoint {
    const height = decoder.u32()

    const index = decoder.u32()

    return new Timepoint(height, index)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.u32(this.height), Encoder.u32(this.index))
  }
}
