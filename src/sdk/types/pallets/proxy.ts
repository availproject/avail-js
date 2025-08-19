import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { mergeArrays } from "../../utils"
import { MultiAddress, ProxyType } from "./../metadata"
import { TransactionCall } from "../../transaction"

export const PALLET_NAME: string = "proxy"
export const PALLET_INDEX: number = 40

export namespace tx {
  export class Proxy {
    constructor(
      public id: MultiAddress,
      public forceProxyType: ProxyType | null, // Option<ProxyType>
      public call: TransactionCall,
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.any(this.id), Encoder.option(this.forceProxyType), Encoder.any(this.call)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 0]
    }

    dispatchIndex(): [number, number] {
      return Proxy.dispatchIndex()
    }

    static decode(decoder: Decoder): Proxy | ClientError {
      const id = MultiAddress.decode(decoder)
      if (id instanceof ClientError) return id

      const forceProxyType = decoder.option(ProxyType)
      if (forceProxyType instanceof ClientError) return forceProxyType

      const call = TransactionCall.decode(decoder)
      if (call instanceof ClientError) return call

      return new Proxy(id, forceProxyType, call)
    }
  }

  export class AddProxy {
    constructor(
      public id: MultiAddress,
      public proxyType: ProxyType,
      public delay: number, // u32
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.any(this.id), Encoder.any(this.proxyType), Encoder.u32(this.delay)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 1]
    }

    dispatchIndex(): [number, number] {
      return AddProxy.dispatchIndex()
    }

    static decode(decoder: Decoder): AddProxy | ClientError {
      const id = decoder.any(MultiAddress)
      if (id instanceof ClientError) return id

      const proxyType = decoder.any(ProxyType)
      if (proxyType instanceof ClientError) return proxyType

      const delay = decoder.u32()
      if (delay instanceof ClientError) return delay

      return new AddProxy(id, proxyType, delay)
    }
  }

  export class RemoveProxy {
    constructor(
      public delegate: MultiAddress,
      public proxyType: ProxyType,
      public delay: number, // u32
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.any(this.delegate), Encoder.any(this.proxyType), Encoder.u32(this.delay)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 2]
    }

    dispatchIndex(): [number, number] {
      return RemoveProxy.dispatchIndex()
    }

    static decode(decoder: Decoder): RemoveProxy | ClientError {
      const delegate = decoder.any(MultiAddress)
      if (delegate instanceof ClientError) return delegate

      const proxyType = decoder.any(ProxyType)
      if (proxyType instanceof ClientError) return proxyType

      const delay = decoder.u32()
      if (delay instanceof ClientError) return delay

      return new RemoveProxy(delegate, proxyType, delay)
    }
  }

  export class RemoveProxies {
    constructor() {}

    encode(): Uint8Array {
      return new Uint8Array()
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 3]
    }

    dispatchIndex(): [number, number] {
      return RemoveProxies.dispatchIndex()
    }

    static decode(_decoder: Decoder): RemoveProxies | ClientError {
      return new RemoveProxies()
    }
  }

  export class CreatePure {
    constructor(
      public proxyType: ProxyType,
      public delay: number, // u32
      public index: number, // u16
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.any(this.proxyType), Encoder.u32(this.delay), Encoder.u16(this.index)])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 4]
    }

    dispatchIndex(): [number, number] {
      return CreatePure.dispatchIndex()
    }

    static decode(decoder: Decoder): CreatePure | ClientError {
      const proxyType = decoder.any(ProxyType)
      if (proxyType instanceof ClientError) return proxyType

      const delay = decoder.u32()
      if (delay instanceof ClientError) return delay

      const index = decoder.u16()
      if (index instanceof ClientError) return index

      return new CreatePure(proxyType, delay, index)
    }
  }

  export class KillPure {
    constructor(
      public spawner: MultiAddress,
      public proxyType: ProxyType,
      public index: number, // u16
      public height: number, // Compact<u32>
      public extIndex: number, // Compact<u32>
    ) {}

    encode(): Uint8Array {
      return mergeArrays([
        Encoder.any(this.spawner),
        Encoder.any(this.proxyType),
        Encoder.u16(this.index),
        Encoder.u32(this.height, true),
        Encoder.u32(this.extIndex, true),
      ])
    }

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 5]
    }

    dispatchIndex(): [number, number] {
      return KillPure.dispatchIndex()
    }

    static decode(decoder: Decoder): KillPure | ClientError {
      const spawner = decoder.any(MultiAddress)
      if (spawner instanceof ClientError) return spawner

      const proxyType = decoder.any(ProxyType)
      if (proxyType instanceof ClientError) return proxyType

      const index = decoder.u16()
      if (index instanceof ClientError) return index

      const height = decoder.u32(true)
      if (height instanceof ClientError) return height

      const extIndex = decoder.u32(true)
      if (extIndex instanceof ClientError) return extIndex

      return new KillPure(spawner, proxyType, index, height, extIndex)
    }
  }
}
