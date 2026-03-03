import { addHeader } from "./../../interface"
import { BN, u8aConcat } from "@polkadot/util"
import { Encoder, Decoder } from "./../../scale"
import { MultiAddress, MultiAddressValue } from "./../../metadata"
import { Bool, CompactU128 } from "./../../scale/types"
import { PALLET_ID } from "./header"

export { PALLET_ID }

export class TransferAllowDeath extends addHeader(PALLET_ID, 0) {
  constructor(
    public dest: MultiAddressValue,
    public value: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransferAllowDeath {
    const result = decoder.any2(MultiAddress, CompactU128)

    return new TransferAllowDeath(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(new MultiAddress(this.dest)), Encoder.u128(this.value, true))
  }
}

export class TransferKeepAlive extends addHeader(PALLET_ID, 3) {
  constructor(
    public dest: MultiAddressValue,
    public value: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransferKeepAlive {
    const result = decoder.any2(MultiAddress, CompactU128)

    return new TransferKeepAlive(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(new MultiAddress(this.dest)), Encoder.u128(this.value, true))
  }
}

export class TransferAll extends addHeader(PALLET_ID, 4) {
  constructor(
    public dest: MultiAddressValue,
    public keepAlive: boolean,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransferAll {
    const result = decoder.any2(MultiAddress, Bool)

    return new TransferAll(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(new MultiAddress(this.dest)), Encoder.bool(this.keepAlive))
  }
}
