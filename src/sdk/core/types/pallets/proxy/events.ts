import { AvailError } from "../../../error"
import { AccountId, DispatchResult, DispatchResultValue, H256 } from "../../metadata"
import { addHeader } from "../."
import { U16, U32, Decoder } from "../../scale"
import { PALLET_ID } from "."
import * as types from "./types"

/// A proxy was executed correctly, with the given.
export class ProxyExecuted extends addHeader(PALLET_ID, 0) {
  constructor(public result: DispatchResultValue) {
    super()
  }

  static decode(decoder: Decoder): ProxyExecuted | AvailError {
    const result = decoder.any1(DispatchResult)
    if (result instanceof AvailError) return result

    return new ProxyExecuted(result.value)
  }
}

/// A pure account has been created by new proxy with given
/// disambiguation index and proxy type.
export class PureCreated extends addHeader(PALLET_ID, 1) {
  constructor(
    public pure: AccountId,
    public who: AccountId,
    public proxyType: types.ProxyTypeValue,
    public disambiguationIndex: number, // u16
  ) {
    super()
  }

  static decode(decoder: Decoder): PureCreated | AvailError {
    const result = decoder.any4(AccountId, AccountId, types.ProxyType, U16)
    if (result instanceof AvailError) return result

    return new PureCreated(...result)
  }
}

/// An announcement was placed to make a call in the future
export class Announced extends addHeader(PALLET_ID, 2) {
  constructor(
    public real: AccountId,
    public proxy: AccountId,
    public callHash: H256,
  ) {
    super()
  }

  static decode(decoder: Decoder): Announced | AvailError {
    const result = decoder.any3(AccountId, AccountId, H256)
    if (result instanceof AvailError) return result

    return new Announced(...result)
  }
}

/// A proxy was added.
export class ProxyAdded extends addHeader(PALLET_ID, 3) {
  constructor(
    public delegator: AccountId,
    public delegatee: AccountId,
    public proxyType: types.ProxyTypeValue,
    public delay: number, // u32
  ) {
    super()
  }

  static decode(decoder: Decoder): ProxyAdded | AvailError {
    const result = decoder.any4(AccountId, AccountId, types.ProxyType, U32)
    if (result instanceof AvailError) return result

    return new ProxyAdded(...result)
  }
}

/// A proxy was removed.
export class ProxyRemoved extends addHeader(PALLET_ID, 4) {
  constructor(
    public delegator: AccountId,
    public delegatee: AccountId,
    public proxyType: types.ProxyTypeValue,
    public delay: number, // u32
  ) {
    super()
  }

  static decode(decoder: Decoder): ProxyRemoved | AvailError {
    const result = decoder.any4(AccountId, AccountId, types.ProxyType, U32)
    if (result instanceof AvailError) return result

    return new ProxyRemoved(...result)
  }
}
