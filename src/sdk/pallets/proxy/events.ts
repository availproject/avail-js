import { Metadata, Decoder, AccountId, H256 } from "../.."
import { PALLET_INDEX, PALLET_NAME } from "."
import { EventRecord, palletEventMatch } from "../../events"

// Batch of dispatches did not complete fully. Index of first failing dispatch given, as well as the error
//
// Checked
export class ProxyExecuted {
  constructor(
    public result: Metadata.DispatchResult,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "ProxyExecuted"
  static EVENT_INDEX: number = 0

  static decode(event: EventRecord): ProxyExecuted | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    const result = new Metadata.DispatchResult(decoder)
    decoder.throwOnRemLength()
    return new ProxyExecuted(result)
  }
}

// A pure account has been created by new proxy with given
// disambiguation index and proxy type.
//
// Checked
export class PureCreated {
  constructor(
    public pure: AccountId,
    public who: AccountId,
    public proxyType: Metadata.ProxyType,
    public disambiguationIndex: number,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "PureCreated"
  static EVENT_INDEX: number = 1

  static decode(event: EventRecord): PureCreated | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    const pure = AccountId.decode(decoder)
    const who = AccountId.decode(decoder)
    const proxyType = new Metadata.ProxyType(decoder)
    const disambiguationIndex = decoder.decodeU16()
    decoder.throwOnRemLength()

    return new PureCreated(pure, who, proxyType, disambiguationIndex)
  }
}

// An announcement was placed to make a call in the future.
export class Announced {
  constructor(
    public real: AccountId,
    public proxy: AccountId,
    public callHash: H256
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "Announced"
  static EVENT_INDEX: number = 2

  static decode(event: EventRecord): Announced | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    const real = AccountId.decode(decoder)
    const proxy = AccountId.decode(decoder)
    const callHash = H256.decode(decoder)
    decoder.throwOnRemLength()

    return new Announced(real, proxy, callHash)
  }
}

// A proxy was added.
//
// Checked
export class ProxyAdded {
  constructor(
    public delegator: AccountId,
    public delegatee: AccountId,
    public proxyType: Metadata.ProxyType,
    public delay: number,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "ProxyAdded"
  static EVENT_INDEX: number = 3

  static decode(event: EventRecord): ProxyAdded | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    const delegator = AccountId.decode(decoder)
    const delegatee = AccountId.decode(decoder)
    const proxyType = new Metadata.ProxyType(decoder)
    const delay = decoder.decodeU32()
    decoder.throwOnRemLength()

    return new ProxyAdded(delegator, delegatee, proxyType, delay)
  }
}

// A proxy was removed.
//
// Checked
export class ProxyRemoved {
  constructor(
    public delegator: AccountId,
    public delegatee: AccountId,
    public proxyType: Metadata.ProxyType,
    public delay: number,
  ) { }

  static PALLET_NAME: string = PALLET_NAME
  static PALLET_INDEX: number = PALLET_INDEX
  static EVENT_NAME: string = "ProxyRemoved"
  static EVENT_INDEX: number = 4

  static decode(event: EventRecord): ProxyRemoved | undefined {
    if (!palletEventMatch(event, this)) {
      return undefined
    }

    const decoder = new Decoder.Decoder(event.inner.event.data.toU8a(), 0)
    const delegator = AccountId.decode(decoder)
    const delegatee = AccountId.decode(decoder)
    const proxyType = new Metadata.ProxyType(decoder)
    const delay = decoder.decodeU32()
    decoder.throwOnRemLength()

    return new ProxyRemoved(delegator, delegatee, proxyType, delay)
  }
}