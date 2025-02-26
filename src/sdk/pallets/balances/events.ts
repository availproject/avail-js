import { AccountId, BN } from "../.."
import { PALLET_INDEX, PALLET_NAME } from "."
import { EventRecord, palletEventMatch } from "../../events"
import { Decoder } from "../../decoder"


// An account was created with some free balance.
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
    return new Endowed(AccountId.decode(decoder), decoder.decodeU128())
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
    return new DustLost(AccountId.decode(decoder), decoder.decodeU128())
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
    return new Transfer(AccountId.decode(decoder), AccountId.decode(decoder), decoder.decodeU128())
  }
}

// Some amount was deposited (e.g. for transaction fees).
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
    return new Deposit(AccountId.decode(decoder), decoder.decodeU128())
  }
}

// Some amount was withdrawn from the account (e.g. for transaction fees)
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
    return new Withdraw(AccountId.decode(decoder), decoder.decodeU128())
  }
}