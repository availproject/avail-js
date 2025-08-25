import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { mergeArrays } from "../../utils"
import { AccountId, DispatchResult, H256, MultiAddress } from "./../metadata"
import { GenericTransactionCall } from "../../transaction"
import { addPalletInfo } from "../../interface"
import { CompactU32, U16, U32 } from "../scale/types"

export const PALLET_NAME: string = "proxy"
export const PALLET_ID: number = 40

export namespace types {
  export type ProxyTypeValue =
    | "Any"
    | "NonTransfer"
    | "Governance"
    | "Staking"
    | "IdentityJudgement"
    | "NominationPools"
  export class ProxyType {
    constructor(public value: ProxyTypeValue) {}

    static decode(decoder: Decoder): ProxyType | ClientError {
      const variant = decoder.u8()
      if (variant instanceof ClientError) return variant

      if (variant == 0) return new ProxyType("Any")
      if (variant == 1) return new ProxyType("NonTransfer")
      if (variant == 2) return new ProxyType("Governance")
      if (variant == 3) return new ProxyType("Staking")
      if (variant == 4) return new ProxyType("IdentityJudgement")
      if (variant == 5) return new ProxyType("NominationPools")

      return new ClientError("Unknown ProxyType")
    }

    encode(): Uint8Array {
      if (this.value == "Any") return Encoder.u8(0)
      if (this.value == "NonTransfer") return Encoder.u8(1)
      if (this.value == "Governance") return Encoder.u8(2)
      if (this.value == "Staking") return Encoder.u8(3)
      if (this.value == "IdentityJudgement") return Encoder.u8(4)

      // NominationPools
      return Encoder.u8(5)
    }
  }
}

export namespace events {
  /// A proxy was executed correctly, with the given.
  export class ProxyExecuted extends addPalletInfo(PALLET_ID, 0) {
    constructor(public result: DispatchResult) {
      super()
    }

    static decode(decoder: Decoder): ProxyExecuted | ClientError {
      const result = decoder.any1(DispatchResult)
      if (result instanceof ClientError) return result

      return new ProxyExecuted(result)
    }
  }

  /// A pure account has been created by new proxy with given
  /// disambiguation index and proxy type.
  export class PureCreated extends addPalletInfo(PALLET_ID, 1) {
    constructor(
      public pure: AccountId,
      public who: AccountId,
      public proxyType: types.ProxyType,
      public disambiguationIndex: number, // u16
    ) {
      super()
    }

    static decode(decoder: Decoder): PureCreated | ClientError {
      const result = decoder.any4(AccountId, AccountId, types.ProxyType, U16)
      if (result instanceof ClientError) return result

      return new PureCreated(...result)
    }
  }

  /// An announcement was placed to make a call in the future
  export class Announced extends addPalletInfo(PALLET_ID, 2) {
    constructor(
      public real: AccountId,
      public proxy: AccountId,
      public callHash: H256,
    ) {
      super()
    }

    static decode(decoder: Decoder): Announced | ClientError {
      const result = decoder.any3(AccountId, AccountId, H256)
      if (result instanceof ClientError) return result

      return new Announced(...result)
    }
  }

  /// A proxy was added.
  export class ProxyAdded extends addPalletInfo(PALLET_ID, 3) {
    constructor(
      public delegator: AccountId,
      public delegatee: AccountId,
      public proxyType: types.ProxyType,
      public delay: number, // u32
    ) {
      super()
    }

    static decode(decoder: Decoder): ProxyAdded | ClientError {
      const result = decoder.any4(AccountId, AccountId, types.ProxyType, U32)
      if (result instanceof ClientError) return result

      return new ProxyAdded(...result)
    }
  }

  /// A proxy was removed.
  export class ProxyRemoved extends addPalletInfo(PALLET_ID, 4) {
    constructor(
      public delegator: AccountId,
      public delegatee: AccountId,
      public proxyType: types.ProxyType,
      public delay: number, // u32
    ) {
      super()
    }

    static decode(decoder: Decoder): ProxyRemoved | ClientError {
      const result = decoder.any4(AccountId, AccountId, types.ProxyType, U32)
      if (result instanceof ClientError) return result

      return new ProxyRemoved(...result)
    }
  }
}

export namespace tx {
  export class Proxy extends addPalletInfo(PALLET_ID, 0) {
    constructor(
      public id: MultiAddress,
      public forceProxyType: types.ProxyType | null, // Option<ProxyType>
      public call: GenericTransactionCall,
    ) {
      super()
    }

    static decode(decoder: Decoder): Proxy | ClientError {
      const id = MultiAddress.decode(decoder)
      if (id instanceof ClientError) return id

      const forceProxyType = decoder.option(types.ProxyType)
      if (forceProxyType instanceof ClientError) return forceProxyType

      const call = GenericTransactionCall.decode(decoder)
      if (call instanceof ClientError) return call

      return new Proxy(id, forceProxyType, call)
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.id), Encoder.option(this.forceProxyType), Encoder.any1(this.call)])
    }
  }

  export class AddProxy extends addPalletInfo(PALLET_ID, 1) {
    constructor(
      public id: MultiAddress,
      public proxyType: types.ProxyType,
      public delay: number, // u32
    ) {
      super()
    }

    static decode(decoder: Decoder): AddProxy | ClientError {
      const id = decoder.any1(MultiAddress)
      if (id instanceof ClientError) return id

      const proxyType = decoder.any1(types.ProxyType)
      if (proxyType instanceof ClientError) return proxyType

      const delay = decoder.u32()
      if (delay instanceof ClientError) return delay

      return new AddProxy(id, proxyType, delay)
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.id), Encoder.any1(this.proxyType), Encoder.u32(this.delay)])
    }
  }

  export class RemoveProxy extends addPalletInfo(PALLET_ID, 2) {
    constructor(
      public delegate: MultiAddress,
      public proxyType: types.ProxyType,
      public delay: number, // u32
    ) {
      super()
    }

    static decode(decoder: Decoder): RemoveProxy | ClientError {
      const delegate = decoder.any1(MultiAddress)
      if (delegate instanceof ClientError) return delegate

      const proxyType = decoder.any1(types.ProxyType)
      if (proxyType instanceof ClientError) return proxyType

      const delay = decoder.u32()
      if (delay instanceof ClientError) return delay

      return new RemoveProxy(delegate, proxyType, delay)
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.delegate), Encoder.any1(this.proxyType), Encoder.u32(this.delay)])
    }
  }

  export class RemoveProxies extends addPalletInfo(PALLET_ID, 3) {
    constructor() {
      super()
    }

    static decode(_decoder: Decoder): RemoveProxies | ClientError {
      return new RemoveProxies()
    }

    encode(): Uint8Array {
      return new Uint8Array()
    }
  }

  export class CreatePure extends addPalletInfo(PALLET_ID, 4) {
    constructor(
      public proxyType: types.ProxyType,
      public delay: number, // u32
      public index: number, // u16
    ) {
      super()
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.any1(this.proxyType), Encoder.u32(this.delay), Encoder.u16(this.index)])
    }

    static decode(decoder: Decoder): CreatePure | ClientError {
      const result = decoder.any3(types.ProxyType, U32, U16)
      if (result instanceof ClientError) return result

      return new CreatePure(...result)
    }
  }

  export class KillPure extends addPalletInfo(PALLET_ID, 5) {
    constructor(
      public spawner: MultiAddress,
      public proxyType: types.ProxyType,
      public index: number, // u16
      public height: number, // Compact<u32>
      public extIndex: number, // Compact<u32>
    ) {
      super()
    }

    encode(): Uint8Array {
      return mergeArrays([
        Encoder.any1(this.spawner),
        Encoder.any1(this.proxyType),
        Encoder.u16(this.index),
        Encoder.u32(this.height, true),
        Encoder.u32(this.extIndex, true),
      ])
    }

    static decode(decoder: Decoder): KillPure | ClientError {
      const value = decoder.any5(MultiAddress, types.ProxyType, U16, CompactU32, CompactU32)
      if (value instanceof ClientError) return value

      return new KillPure(...value)
    }
  }
}
