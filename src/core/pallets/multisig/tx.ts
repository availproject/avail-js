import { addHeader } from "./../../interface"
import { Encoder } from "./../../scale/encoder"
import { Decoder } from "./../../scale/decoder"
import { AccountId, H256, Weight } from "./../../metadata"
import { u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"
import * as types from "./types"
import { RuntimeCall } from "./../runtime_call"

export { PALLET_ID }

export class AsMultiThreshold1 extends addHeader(PALLET_ID, 0) {
  constructor(
    public otherSignatories: AccountId[], // Vec<AccountId>
    public call: Uint8Array,
  ) {
    super()
  }

  static decode(decoder: Decoder): AsMultiThreshold1 {
    const otherSignatories = decoder.vec(AccountId)

    const call = decoder.consumeRemainingBytes()

    return new AsMultiThreshold1(otherSignatories, call)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.vec(this.otherSignatories), this.call)
  }
}

export class AsMulti extends addHeader(PALLET_ID, 1) {
  constructor(
    public threshold: number, // u16
    public otherSignatories: AccountId[], // Vec<AccountId>
    public maybeTimepoint: types.Timepoint | null, // Option<Timepoint>
    public runtimeCall: Uint8Array,
    public maxWeight: Weight,
  ) {
    super()
  }

  static decode(decoder: Decoder): AsMulti {
    const threshold = decoder.u16()

    const otherSignatories = decoder.vec(AccountId)

    const maybeTimepoint = decoder.option(types.Timepoint)

    const call = decoder.any1(RuntimeCall)

    const maxWeight = decoder.any1(Weight)

    return new AsMulti(threshold, otherSignatories, maybeTimepoint, call.value.encode(), maxWeight)
  }

  encode(): Uint8Array {
    return u8aConcat(
      Encoder.u16(this.threshold),
      Encoder.vec(this.otherSignatories),
      Encoder.option(this.maybeTimepoint),
      this.runtimeCall,
      Encoder.any1(this.maxWeight),
    )
  }
}

export class ApproveAsMulti extends addHeader(PALLET_ID, 2) {
  constructor(
    public threshold: number, // u16
    public otherSignatories: AccountId[], // Vec<AccountId>
    public maybeTimepoint: types.Timepoint | null, // Option<Timepoint>
    public callHash: H256,
    public maxWeight: Weight,
  ) {
    super()
  }

  encode(): Uint8Array {
    return u8aConcat(
      Encoder.u16(this.threshold),
      Encoder.vec(this.otherSignatories),
      Encoder.option(this.maybeTimepoint),
      Encoder.any1(this.callHash),
      Encoder.any1(this.maxWeight),
    )
  }

  static decode(decoder: Decoder): ApproveAsMulti {
    const threshold = decoder.u16()

    const otherSignatories = decoder.vec(AccountId)

    const maybeTimepoint = decoder.option(types.Timepoint)

    const callHash = decoder.any1(H256)

    const maxWeight = decoder.any1(Weight)

    return new ApproveAsMulti(threshold, otherSignatories, maybeTimepoint, callHash, maxWeight)
  }
}

export class CancelAsMulti extends addHeader(PALLET_ID, 3) {
  constructor(
    public threshold: number, // u16
    public otherSignatories: AccountId[], // Vec<AccountId>
    public timepoint: types.Timepoint,
    public callHash: H256,
  ) {
    super()
  }

  encode(): Uint8Array {
    return u8aConcat(
      Encoder.u16(this.threshold),
      Encoder.vec(this.otherSignatories),
      Encoder.any1(this.timepoint),
      Encoder.any1(this.callHash),
    )
  }

  static decode(decoder: Decoder): CancelAsMulti {
    const threshold = decoder.u16()

    const otherSignatories = decoder.vec(AccountId)

    const maybeTimepoint = decoder.any1(types.Timepoint)

    const callHash = decoder.any1(H256)

    return new CancelAsMulti(threshold, otherSignatories, maybeTimepoint, callHash)
  }
}
