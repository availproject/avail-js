import { addHeader } from "./../../interface"
import { AvailError } from "../../misc/error"
import { Decoder } from "./../../scale"
import { MultiAddress } from "../../metadata"
import { u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"

export class Sudo extends addHeader(PALLET_ID, 0) {
  constructor(
    public call: Uint8Array, // Already encoded call
  ) {
    super()
  }
  static decode(decoder: Decoder): Sudo | AvailError {
    const value = decoder.consumeRemainingBytes()
    if (value instanceof AvailError) return value

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
  static decode(decoder: Decoder): SudoAs | AvailError {
    const who = decoder.any1(MultiAddress)
    if (who instanceof AvailError) return who

    const value = decoder.consumeRemainingBytes()
    if (value instanceof AvailError) return value

    return new SudoAs(who, value)
  }

  encode(): Uint8Array {
    return u8aConcat(this.who.encode(), this.call)
  }
}
