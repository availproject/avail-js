import { Encoder, Decoder } from "../../scale"
import { AvailError } from "../../../error"
import { u8aConcat } from "../../polkadot"

export class Timepoint {
  constructor(
    public height: number, // u32
    public index: number, // u32
  ) {}

  static decode(decoder: Decoder): Timepoint | AvailError {
    const height = decoder.u32()
    if (height instanceof AvailError) return height

    const index = decoder.u32()
    if (index instanceof AvailError) return index

    return new Timepoint(height, index)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.u32(this.height), Encoder.u32(this.index))
  }
}
