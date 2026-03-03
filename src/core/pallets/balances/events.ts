import { AccountId } from "../../metadata"
import { addHeader } from "./../../interface"
import { Decoder, U128 } from "./../../scale"
import { PALLET_ID } from "./header"
import { BN } from "@polkadot/util"

/// An account was created with some free balance.
export class Endowed extends addHeader(PALLET_ID, 0) {
  constructor(
    public account: AccountId,
    public freeBalance: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Endowed {
    const result = decoder.any2(AccountId, U128)

    return new Endowed(...result)
  }
}

/// An account was created with some free balance.
export class DustLost extends addHeader(PALLET_ID, 1) {
  constructor(
    public account: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): DustLost {
    const result = decoder.any2(AccountId, U128)

    return new DustLost(...result)
  }
}

/// Transfer succeeded.
export class Transfer extends addHeader(PALLET_ID, 2) {
  constructor(
    public from: AccountId,
    public to: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Transfer {
    const result = decoder.any3(AccountId, AccountId, U128)

    return new Transfer(...result)
  }
}

/// Some balance was reserved (moved from free to reserved).
export class Reserved extends addHeader(PALLET_ID, 4) {
  constructor(
    public who: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Reserved {
    const result = decoder.any2(AccountId, U128)

    return new Reserved(...result)
  }
}

/// Some balance was unreserved (moved from reserved to free).
export class Unreserved extends addHeader(PALLET_ID, 5) {
  constructor(
    public who: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Unreserved {
    const result = decoder.any2(AccountId, U128)

    return new Unreserved(...result)
  }
}

/// Some amount was deposited (e.g. for transaction fees).
export class Deposit extends addHeader(PALLET_ID, 7) {
  constructor(
    public who: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Deposit {
    const result = decoder.any2(AccountId, U128)

    return new Deposit(...result)
  }
}

/// Some amount was withdrawn from the account (e.g. for transaction fees).
export class Withdraw extends addHeader(PALLET_ID, 8) {
  constructor(
    public who: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Withdraw {
    const result = decoder.any2(AccountId, U128)

    return new Withdraw(...result)
  }
}

/// Some amount was removed from the account (e.g. for misbehavior).
export class Slashed extends addHeader(PALLET_ID, 9) {
  constructor(
    public who: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Slashed {
    const result = decoder.any2(AccountId, U128)

    return new Slashed(...result)
  }
}

/// Some balance was locked..
export class Locked extends addHeader(PALLET_ID, 17) {
  constructor(
    public who: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Locked {
    const result = decoder.any2(AccountId, U128)

    return new Locked(...result)
  }
}

/// Some balance was unlocked.
export class Unlocked extends addHeader(PALLET_ID, 18) {
  constructor(
    public who: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Unlocked {
    const result = decoder.any2(AccountId, U128)

    return new Unlocked(...result)
  }
}

/// Some balance was frozen.
export class Frozen extends addHeader(PALLET_ID, 19) {
  constructor(
    public who: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Frozen {
    const result = decoder.any2(AccountId, U128)

    return new Frozen(...result)
  }
}

/// Some balance was thawed.
export class Thawed extends addHeader(PALLET_ID, 20) {
  constructor(
    public who: AccountId,
    public amount: BN, // u128
  ) {
    super()
  }

  static decode(decoder: Decoder): Thawed {
    const result = decoder.any2(AccountId, U128)

    return new Thawed(...result)
  }
}
