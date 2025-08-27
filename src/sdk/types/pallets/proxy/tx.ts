import ClientError from "../../../error"
import { mergeArrays } from "../../../utils"
import { MultiAddress } from "../../metadata"
import { addHeader } from "../../../interface"
import { CompactU32, U16, U32, Encoder, Decoder } from "../../scale"
import { u8aConcat } from "../../polkadot"
import { PALLET_ID } from "."
import * as types from "./types"

export class Proxy extends addHeader(PALLET_ID, 0) {
  constructor(
    public id: MultiAddress,
    public forceProxyType: types.ProxyType | null, // Option<ProxyType>
    public call: Uint8Array,
  ) {
    super()
  }

  static decode(decoder: Decoder): Proxy | ClientError {
    const id = MultiAddress.decode(decoder)
    if (id instanceof ClientError) return id

    const forceProxyType = decoder.option(types.ProxyType)
    if (forceProxyType instanceof ClientError) return forceProxyType

    const call = decoder.remainingBytes()
    if (call instanceof ClientError) return call

    return new Proxy(id, forceProxyType, call)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(this.id), Encoder.option(this.forceProxyType), this.call)
  }
}

export class AddProxy extends addHeader(PALLET_ID, 1) {
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

export class RemoveProxy extends addHeader(PALLET_ID, 2) {
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

export class RemoveProxies extends addHeader(PALLET_ID, 3) {
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

export class CreatePure extends addHeader(PALLET_ID, 4) {
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

export class KillPure extends addHeader(PALLET_ID, 5) {
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
