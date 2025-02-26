import { AccountId, BN } from "../.."
import { PALLET_INDEX, PALLET_NAME } from "."
import { EventRecord, palletEventMatch } from "../../events"
import { Decoder } from "../../decoder"


// An account was created with some free balance.
//
// Checked
export class Endowed {
  constructor(
    public account: AccountId,
    public freeBalance: BN,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "Endowed"
  static EVENT_INDEX: number = 0

  static decode(event: EventRecord): Endowed | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(), 0)
    const account = AccountId.decode(decoder)
    const freeBalance = decoder.decodeU128()
    decoder.throwOnRemLength()
    return new Endowed(account, freeBalance)
  }
}

// An account was removed whose balance was non-zero but below ExistentialDeposit, resulting in an outright loss.
export class DustLost {
  constructor(
    public account: AccountId,
    public amount: BN,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "DustLost"
  static EVENT_INDEX: number = 1

  static decode(event: EventRecord): DustLost | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(), 0)
    const account = AccountId.decode(decoder)
    const amount = decoder.decodeU128()
    decoder.throwOnRemLength()
    return new DustLost(account, amount)
  }
}

// Transfer succeeded.
//
// Checked
export class Transfer {
  constructor(
    public from: AccountId,
    public to: AccountId,
    public amount: BN,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "Transfer"
  static EVENT_INDEX: number = 2

  static decode(event: EventRecord): Transfer | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(), 0)
    const from = AccountId.decode(decoder)
    const to = AccountId.decode(decoder)
    const amount = decoder.decodeU128()
    decoder.throwOnRemLength()
    return new Transfer(from, to, amount)
  }
}

// Some amount was deposited (e.g. for transaction fees).
//
// Checked
export class Deposit {
  constructor(
    public who: AccountId,
    public amount: BN,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "Deposit"
  static EVENT_INDEX: number = 7

  static decode(event: EventRecord): Deposit | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(), 0)
    const who = AccountId.decode(decoder)
    const amount = decoder.decodeU128()
    decoder.throwOnRemLength()
    return new Deposit(who, amount)
  }
}

// Some amount was withdrawn from the account (e.g. for transaction fees)
//
// Checked
export class Withdraw {
  constructor(
    public who: AccountId,
    public amount: BN,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "Withdraw"
  static EVENT_INDEX: number = 8

  static decode(event: EventRecord): Withdraw | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder(event.inner.event.data.toU8a(), 0)
    const who = AccountId.decode(decoder)
    const amount = decoder.decodeU128()
    decoder.throwOnRemLength()
    return new Withdraw(who, amount)
  }
}