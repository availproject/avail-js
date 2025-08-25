import { BN } from "./../polkadot"
import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { mergeArrays } from "../../utils"
import { AccountId, MultiAddress } from "./../metadata"
import { addPalletInfo } from "../../interface"
import { Bool, CompactU128, U128 } from "../scale/types"

export const PALLET_NAME: string = "balances"
export const PALLET_ID: number = 6

export namespace events {
  /// An account was created with some free balance.
  export class Endowed extends addPalletInfo(PALLET_ID, 0) {
    constructor(
      public account: AccountId,
      public freeBalance: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Endowed | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new Endowed(...result)
    }
  }

  /// An account was created with some free balance.
  export class DustLost extends addPalletInfo(PALLET_ID, 1) {
    constructor(
      public account: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): DustLost | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new DustLost(...result)
    }
  }

  /// Transfer succeeded.
  export class Transfer extends addPalletInfo(PALLET_ID, 2) {
    constructor(
      public from: AccountId,
      public to: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Transfer | ClientError {
      const result = decoder.any3(AccountId, AccountId, U128)
      if (result instanceof ClientError) return result

      return new Transfer(...result)
    }
  }

  /// Some balance was reserved (moved from free to reserved).
  export class Reserved extends addPalletInfo(PALLET_ID, 4) {
    constructor(
      public who: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Reserved | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new Reserved(...result)
    }
  }

  /// Some balance was unreserved (moved from reserved to free).
  export class Unreserved extends addPalletInfo(PALLET_ID, 5) {
    constructor(
      public who: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Unreserved | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new Unreserved(...result)
    }
  }

  /// Some amount was deposited (e.g. for transaction fees).
  export class Deposit extends addPalletInfo(PALLET_ID, 7) {
    constructor(
      public who: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Deposit | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new Deposit(...result)
    }
  }

  /// Some amount was withdrawn from the account (e.g. for transaction fees).
  export class Withdraw extends addPalletInfo(PALLET_ID, 8) {
    constructor(
      public who: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Withdraw | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new Withdraw(...result)
    }
  }

  /// Some amount was removed from the account (e.g. for misbehavior).
  export class Slashed extends addPalletInfo(PALLET_ID, 9) {
    constructor(
      public who: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Slashed | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new Slashed(...result)
    }
  }

  /// Some balance was locked..
  export class Locked extends addPalletInfo(PALLET_ID, 17) {
    constructor(
      public who: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Locked | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new Locked(...result)
    }
  }

  /// Some balance was unlocked.
  export class Unlocked extends addPalletInfo(PALLET_ID, 18) {
    constructor(
      public who: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Unlocked | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new Unlocked(...result)
    }
  }

  /// Some balance was frozen.
  export class Frozen extends addPalletInfo(PALLET_ID, 19) {
    constructor(
      public who: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Frozen | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new Frozen(...result)
    }
  }

  /// Some balance was thawed.
  export class Thawed extends addPalletInfo(PALLET_ID, 20) {
    constructor(
      public who: AccountId,
      public amount: BN, // u128
    ) {
      super()
    }

    static decode(decoder: Decoder): Thawed | ClientError {
      const result = decoder.any2(AccountId, U128)
      if (result instanceof ClientError) return result

      return new Thawed(...result)
    }
  }
}

export namespace tx {
  export class TransferAllowDeath extends addPalletInfo(PALLET_ID, 0) {
    constructor(
      public dest: MultiAddress,
      public value: BN,
    ) {
      super()
    }

    static decode(decoder: Decoder): TransferAllowDeath | ClientError {
      const result = decoder.any2(MultiAddress, CompactU128)
      if (result instanceof ClientError) return result

      return new TransferAllowDeath(...result)
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.dest), Encoder.u128(this.value, true)])
    }
  }

  export class TransferKeepAlive extends addPalletInfo(PALLET_ID, 3) {
    constructor(
      public dest: MultiAddress,
      public value: BN,
    ) {
      super()
    }

    static decode(decoder: Decoder): TransferKeepAlive | ClientError {
      const result = decoder.any2(MultiAddress, CompactU128)
      if (result instanceof ClientError) return result

      return new TransferKeepAlive(...result)
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.dest), Encoder.u128(this.value, true)])
    }
  }

  export class TransferAll extends addPalletInfo(PALLET_ID, 4) {
    constructor(
      public dest: MultiAddress,
      public keepAlive: boolean,
    ) {
      super()
    }

    static decode(decoder: Decoder): TransferAll | ClientError {
      const result = decoder.any2(MultiAddress, Bool)
      if (result instanceof ClientError) return result

      return new TransferAll(...result)
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.dest), Encoder.bool(this.keepAlive)])
    }
  }
}
