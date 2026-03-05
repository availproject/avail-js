import { addHeader } from "./../../interface"
import { BN, u8aConcat } from "@polkadot/util"
import { Encoder, Decoder } from "./../../scale"
import { MultiAddress } from "./../../types"
import { Bool, CompactU128 } from "./../../scale/types"
import { PALLET_ID } from "./header"
import { MultiAddressScale } from "../../scale/types"

export { PALLET_ID }

export class TransferAllowDeath extends addHeader(PALLET_ID, 0) {
  constructor(
    public dest: MultiAddress,
    public value: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransferAllowDeath {
    const result = decoder.any2(MultiAddressScale, CompactU128)

    return new TransferAllowDeath(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(new MultiAddressScale(this.dest)), Encoder.u128(this.value, true))
  }
}

export class TransferKeepAlive extends addHeader(PALLET_ID, 3) {
  constructor(
    public dest: MultiAddress,
    public value: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransferKeepAlive {
    const result = decoder.any2(MultiAddressScale, CompactU128)

    return new TransferKeepAlive(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(new MultiAddressScale(this.dest)), Encoder.u128(this.value, true))
  }
}

export class TransferAll extends addHeader(PALLET_ID, 4) {
  constructor(
    public dest: MultiAddress,
    public keepAlive: boolean,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransferAll {
    const result = decoder.any2(MultiAddressScale, Bool)

    return new TransferAll(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(new MultiAddressScale(this.dest)), Encoder.bool(this.keepAlive))
  }
}
