import { addHeader } from "./../../interface"
import { BN, u8aConcat } from "@polkadot/util"
import { Encoder, Decoder } from "./../../scale"
import { AvailError } from "../../zero_dep/error"
import { mergeArrays } from "../../zero_dep/utils"
import { MultiAddress } from "./../../metadata"
import { Bool, CompactU128 } from "./../../scale/types"
import { PALLET_ID } from "./header"

export class TransferAllowDeath extends addHeader(PALLET_ID, 0) {
  constructor(
    public dest: MultiAddress,
    public value: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransferAllowDeath | AvailError {
    const result = decoder.any2(MultiAddress, CompactU128)
    if (result instanceof AvailError) return result

    return new TransferAllowDeath(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(this.dest), Encoder.u128(this.value, true))
  }
}

export class TransferKeepAlive extends addHeader(PALLET_ID, 3) {
  constructor(
    public dest: MultiAddress,
    public value: BN,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransferKeepAlive | AvailError {
    const result = decoder.any2(MultiAddress, CompactU128)
    if (result instanceof AvailError) return result

    return new TransferKeepAlive(...result)
  }

  encode(): Uint8Array {
    return mergeArrays([Encoder.any1(this.dest), Encoder.u128(this.value, true)])
  }
}

export class TransferAll extends addHeader(PALLET_ID, 4) {
  constructor(
    public dest: MultiAddress,
    public keepAlive: boolean,
  ) {
    super()
  }

  static decode(decoder: Decoder): TransferAll | AvailError {
    const result = decoder.any2(MultiAddress, Bool)
    if (result instanceof AvailError) return result

    return new TransferAll(...result)
  }

  encode(): Uint8Array {
    return mergeArrays([Encoder.any1(this.dest), Encoder.bool(this.keepAlive)])
  }
}
