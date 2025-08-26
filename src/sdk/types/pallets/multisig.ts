import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { mergeArrays } from "../../utils"
import { AccountId, DispatchResult, H256, Weight } from "./../metadata"
import { GenericTransactionCall } from "../../transaction"
import { addPalletInfo } from "../../interface"
import { u8aConcat } from "../polkadot"
import { RuntimeCall } from "."

export const PALLET_NAME: string = "multisig"
export const PALLET_ID: number = 34

export namespace types {
  export class Timepoint {
    constructor(
      public height: number, // u32
      public index: number, // u32
    ) {}

    static decode(decoder: Decoder): Timepoint | ClientError {
      const height = decoder.u32()
      if (height instanceof ClientError) return height

      const index = decoder.u32()
      if (index instanceof ClientError) return index

      return new Timepoint(height, index)
    }

    encode(): Uint8Array {
      return u8aConcat(Encoder.u32(this.height), Encoder.u32(this.index))
    }
  }
}

export namespace events {
  /// A new multisig operation has begun.
  export class NewMultisig extends addPalletInfo(PALLET_ID, 0) {
    constructor(
      public approving: AccountId,
      public multisig: AccountId,
      public callHash: H256,
    ) {
      super()
    }

    static decode(decoder: Decoder): NewMultisig | ClientError {
      const result = decoder.any3(AccountId, AccountId, H256)
      if (result instanceof ClientError) return result

      return new NewMultisig(...result)
    }
  }

  /// A multisig operation has been approved by someone.
  export class MultisigApproval extends addPalletInfo(PALLET_ID, 1) {
    constructor(
      public approving: AccountId,
      public timepoint: types.Timepoint,
      public multisig: AccountId,
      public callHash: H256,
    ) {
      super()
    }

    static decode(decoder: Decoder): MultisigApproval | ClientError {
      const result = decoder.any4(AccountId, types.Timepoint, AccountId, H256)
      if (result instanceof ClientError) return result

      return new MultisigApproval(...result)
    }
  }

  /// A multisig operation has been executed.
  export class MultisigExecuted extends addPalletInfo(PALLET_ID, 2) {
    constructor(
      public approving: AccountId,
      public timepoint: types.Timepoint,
      public multisig: AccountId,
      public callHash: H256,
      public result: DispatchResult,
    ) {
      super()
    }

    static decode(decoder: Decoder): MultisigExecuted | ClientError {
      const result = decoder.any5(AccountId, types.Timepoint, AccountId, H256, DispatchResult)
      if (result instanceof ClientError) return result

      return new MultisigExecuted(...result)
    }
  }

  /// A multisig operation has been cancelled.
  export class MultisigCancelled extends addPalletInfo(PALLET_ID, 3) {
    constructor(
      public cancelling: AccountId,
      public timepoint: types.Timepoint,
      public multisig: AccountId,
      public callHash: H256,
    ) {
      super()
    }

    static decode(decoder: Decoder): MultisigCancelled | ClientError {
      const result = decoder.any4(AccountId, types.Timepoint, AccountId, H256)
      if (result instanceof ClientError) return result

      return new MultisigCancelled(...result)
    }
  }
}

export namespace tx {
  export class AsMultiThreshold1 extends addPalletInfo(PALLET_ID, 0) {
    constructor(
      public otherSignatories: AccountId[], // Vec<AccountId>
      public call: Uint8Array,
    ) {
      super()
    }

    static decode(decoder: Decoder): AsMultiThreshold1 | ClientError {
      const otherSignatories = decoder.vec(AccountId)
      if (otherSignatories instanceof ClientError) return otherSignatories

      const call = decoder.remainingBytes()
      if (call instanceof ClientError) return call

      return new AsMultiThreshold1(otherSignatories, call)
    }

    encode(): Uint8Array {
      return u8aConcat(Encoder.vec(this.otherSignatories), this.call)
    }
  }

  export class AsMulti extends addPalletInfo(PALLET_ID, 1) {
    constructor(
      public threshold: number, // u16
      public otherSignatories: AccountId[], // Vec<AccountId>
      public maybeTimepoint: types.Timepoint | null, // Option<Timepoint>
      public runtimeCall: Uint8Array,
      public maxWeight: Weight,
    ) {
      super()
    }

    static decode(decoder: Decoder): AsMulti | ClientError {
      const threshold = decoder.u16()
      if (threshold instanceof ClientError) return threshold

      const otherSignatories = decoder.vec(AccountId)
      if (otherSignatories instanceof ClientError) return otherSignatories

      const maybeTimepoint = decoder.option(types.Timepoint)
      if (maybeTimepoint instanceof ClientError) return maybeTimepoint

      const call = decoder.any1(RuntimeCall)
      if (call instanceof ClientError) return call

      const maxWeight = decoder.any1(Weight)
      if (maxWeight instanceof ClientError) return maxWeight

      return new AsMulti(threshold, otherSignatories, maybeTimepoint, call.value.encode(), maxWeight)
    }

    encode(): Uint8Array {
      return mergeArrays([
        Encoder.u16(this.threshold),
        Encoder.vec(this.otherSignatories),
        Encoder.option(this.maybeTimepoint),
        this.runtimeCall,
        Encoder.any1(this.maxWeight),
      ])
    }
  }

  export class ApproveAsMulti extends addPalletInfo(PALLET_ID, 2) {
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

  export class CancelAsMulti extends addPalletInfo(PALLET_ID, 3) {
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
