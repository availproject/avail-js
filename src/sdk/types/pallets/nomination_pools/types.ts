import { Encoder, Decoder, U128 } from "../../scale"
import { ClientError } from "../../../error"
import { BN } from "../../polkadot"

export type BondExtraValue = { FreeBalance: BN /* U128*/ } | "Rewards"
export class BondExtra {
  constructor(public value: BondExtraValue) {}

  static decode(decoder: Decoder): BondExtraValue | ClientError {
    const variant = decoder.byte()
    if (variant instanceof ClientError) return variant
    if (variant == 0) {
      const balance = decoder.any1(U128)
      if (balance instanceof ClientError) return balance

      return { FreeBalance: balance }
    }
    if (variant == 1) return "Rewards"

    return new ClientError("Cannot decode BondExtra")
  }

  encode(): Uint8Array {
    if (typeof this.value == "string") return Encoder.u8(1)

    return Encoder.enum(0, new U128(this.value.FreeBalance))
  }
}
