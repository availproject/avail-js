import { addHeader } from "./../../interface"
import { AvailError } from "../../error"
import { Decoder } from "./../../scale"
import { MultiAddress, MultiAddressValue } from "../../metadata"
import { u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"

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
    public who: MultiAddressValue,
    public call: Uint8Array, // Already encoded call
  ) {
    super()
  }
  static decode(decoder: Decoder): SudoAs {
    const who = decoder.any1(MultiAddress)

    const value = decoder.consumeRemainingBytes()

    return new SudoAs(who, value)
  }

  encode(): Uint8Array {
    return u8aConcat(new MultiAddress(this.who).encode(), this.call)
  }
}
