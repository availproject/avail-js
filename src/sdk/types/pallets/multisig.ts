import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { mergeArrays } from "../../utils"
import { AccountId, H256, Weight } from "./../metadata"
import { GenericTransactionCall } from "../../transaction"
import { addPalletInfo } from "../../interface"

export const PALLET_NAME: string = "multisig"
export const PALLET_INDEX: number = 34

export namespace types {
  export class Timepoint {
    constructor(
      public height: number, // u32
      public index: number, // u32
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.u32(this.height), Encoder.u32(this.index)])
    }

    static decode(decoder: Decoder): Timepoint | ClientError {
      const height = decoder.u32()
      if (height instanceof ClientError) return height

      const index = decoder.u32()
      if (index instanceof ClientError) return index

      return new Timepoint(height, index)
    }
  }
}

export namespace tx {
  export class AsMultiThreshold1 extends addPalletInfo(PALLET_INDEX, 0) {
    constructor(
      public otherSignatories: AccountId[], // Vec<AccountId>
      public call: GenericTransactionCall,
    ) {
      super()
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.vec(this.otherSignatories), Encoder.any1(this.call)])
    }

    static decode(decoder: Decoder): AsMultiThreshold1 | ClientError {
      const otherSignatories = decoder.vec(AccountId)
      if (otherSignatories instanceof ClientError) return otherSignatories

      const call = decoder.any1(GenericTransactionCall)
      if (call instanceof ClientError) return call

      return new AsMultiThreshold1(otherSignatories, call)
    }
  }

  export class AsMulti extends addPalletInfo(PALLET_INDEX, 1) {
    constructor(
      public threshold: number, // u16
      public otherSignatories: AccountId[], // Vec<AccountId>
      public maybeTimepoint: types.Timepoint | null, // Option<Timepoint>
      public call: GenericTransactionCall,
      public maxWeight: Weight,
    ) {
      super()
    }

    encode(): Uint8Array {
      return mergeArrays([
        Encoder.u16(this.threshold),
        Encoder.vec(this.otherSignatories),
        Encoder.option(this.maybeTimepoint),
        Encoder.any1(this.call),
        Encoder.any1(this.maxWeight),
      ])
    }

    static decode(decoder: Decoder): AsMulti | ClientError {
      const threshold = decoder.u16()
      if (threshold instanceof ClientError) return threshold

      const otherSignatories = decoder.vec(AccountId)
      if (otherSignatories instanceof ClientError) return otherSignatories

      const maybeTimepoint = decoder.option(types.Timepoint)
      if (maybeTimepoint instanceof ClientError) return maybeTimepoint

      const call = decoder.any1(GenericTransactionCall)
      if (call instanceof ClientError) return call

      const maxWeight = decoder.any1(Weight)
      if (maxWeight instanceof ClientError) return maxWeight

      return new AsMulti(threshold, otherSignatories, maybeTimepoint, call, maxWeight)
    }
  }

  export class ApproveAsMulti extends addPalletInfo(PALLET_INDEX, 2) {
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
      return mergeArrays([
        Encoder.u16(this.threshold),
        Encoder.vec(this.otherSignatories),
        Encoder.option(this.maybeTimepoint),
        Encoder.any1(this.callHash),
        Encoder.any1(this.maxWeight),
      ])
    }

    static decode(decoder: Decoder): ApproveAsMulti | ClientError {
      const threshold = decoder.u16()
      if (threshold instanceof ClientError) return threshold

      const otherSignatories = decoder.vec(AccountId)
      if (otherSignatories instanceof ClientError) return otherSignatories

      const maybeTimepoint = decoder.option(types.Timepoint)
      if (maybeTimepoint instanceof ClientError) return maybeTimepoint

      const callHash = decoder.any1(H256)
      if (callHash instanceof ClientError) return callHash

      const maxWeight = decoder.any1(Weight)
      if (maxWeight instanceof ClientError) return maxWeight

      return new ApproveAsMulti(threshold, otherSignatories, maybeTimepoint, callHash, maxWeight)
    }
  }

  export class CancelAsMulti extends addPalletInfo(PALLET_INDEX, 3) {
    constructor(
      public threshold: number, // u16
      public otherSignatories: AccountId[], // Vec<AccountId>
      public timepoint: types.Timepoint,
      public callHash: H256,
    ) {
      super()
    }

    encode(): Uint8Array {
      return mergeArrays([
        Encoder.u16(this.threshold),
        Encoder.vec(this.otherSignatories),
        Encoder.any1(this.timepoint),
        Encoder.any1(this.callHash),
      ])
    }

    static decode(decoder: Decoder): CancelAsMulti | ClientError {
      const threshold = decoder.u16()
      if (threshold instanceof ClientError) return threshold

      const otherSignatories = decoder.vec(AccountId)
      if (otherSignatories instanceof ClientError) return otherSignatories

      const maybeTimepoint = decoder.any1(types.Timepoint)
      if (maybeTimepoint instanceof ClientError) return maybeTimepoint

      const callHash = decoder.any1(H256)
      if (callHash instanceof ClientError) return callHash

      return new CancelAsMulti(threshold, otherSignatories, maybeTimepoint, callHash)
    }
  }
}
