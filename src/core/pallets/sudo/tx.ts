import { addHeader } from "./../../interface"
import { Decoder } from "./../../scale"
import { MultiAddress } from "../../types"
import { u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"
import { MultiAddressScale } from "../../scale/types"

export { PALLET_ID }

export class Sudo extends addHeader(PALLET_ID, 0) {
  constructor(
    public call: Uint8Array, // Already encoded call
  ) {
    super()
  }
  static decode(decoder: Decoder): Sudo {
    const value = decoder.consumeRemainingBytes()

    return new Sudo(value)
  }

  encode(): Uint8Array {
    return this.call
  }
}

export class SudoAs extends addHeader(PALLET_ID, 3) {
  constructor(
    public who: MultiAddress,
    public call: Uint8Array, // Already encoded call
  ) {
    super()
  }
  static decode(decoder: Decoder): SudoAs {
    const who = decoder.any1(MultiAddressScale)

    const value = decoder.consumeRemainingBytes()

    return new SudoAs(who, value)
  }

  encode(): Uint8Array {
    return u8aConcat(new MultiAddressScale(this.who).encode(), this.call)
  }
}
