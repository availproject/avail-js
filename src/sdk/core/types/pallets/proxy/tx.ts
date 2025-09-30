import { addHeader } from "../."

import { AvailError } from "../../../error"
import { MultiAddress } from "../../metadata"
import { CompactU32, U16, U32, Encoder, Decoder } from "../../scale"
import { u8aConcat } from "../../polkadot"
import { PALLET_ID } from "."
import * as types from "./types"

export class Proxy extends addHeader(PALLET_ID, 0) {
  constructor(
    public id: MultiAddress,
    public forceProxyType: types.ProxyTypeValue | null, // Option<ProxyType>
    public call: Uint8Array,
  ) {
    super()
  }

  static decode(decoder: Decoder): Proxy | AvailError {
    const id = MultiAddress.decode(decoder)
    if (id instanceof AvailError) return id

    const forceProxyType = decoder.option(types.ProxyType)
    if (forceProxyType instanceof AvailError) return forceProxyType

    const call = decoder.consumeRemainingBytes()
    if (call instanceof AvailError) return call

    return new Proxy(id, forceProxyType, call)
  }

  encode(): Uint8Array {
    return u8aConcat(
      Encoder.any1(this.id),
      Encoder.option(this.forceProxyType ? new types.ProxyType(this.forceProxyType) : null),
      this.call,
    )
  }
}

export class AddProxy extends addHeader(PALLET_ID, 1) {
  constructor(
    public id: MultiAddress,
    public proxyType: types.ProxyTypeValue,
    public delay: number, // u32
  ) {
    super()
  }

  static decode(decoder: Decoder): AddProxy | AvailError {
    const result = decoder.any3(MultiAddress, types.ProxyType, U32)
    if (result instanceof AvailError) return result

    return new AddProxy(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(this.id), new types.ProxyType(this.proxyType).encode(), Encoder.u32(this.delay))
  }
}

export class RemoveProxy extends addHeader(PALLET_ID, 2) {
  constructor(
    public delegate: MultiAddress,
    public proxyType: types.ProxyTypeValue,
    public delay: number, // u32
  ) {
    super()
  }

  static decode(decoder: Decoder): RemoveProxy | AvailError {
    const result = decoder.any3(MultiAddress, types.ProxyType, U32)
    if (result instanceof AvailError) return result

    return new RemoveProxy(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.any1(this.delegate), new types.ProxyType(this.proxyType).encode(), Encoder.u32(this.delay))
  }
}

export class RemoveProxies extends addHeader(PALLET_ID, 3) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): RemoveProxies | AvailError {
    return new RemoveProxies()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

export class CreatePure extends addHeader(PALLET_ID, 4) {
  constructor(
    public proxyType: types.ProxyTypeValue,
    public delay: number, // u32
    public index: number, // u16
  ) {
    super()
  }

  static decode(decoder: Decoder): CreatePure | AvailError {
    const result = decoder.any3(types.ProxyType, U32, U16)
    if (result instanceof AvailError) return result

    return new CreatePure(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(new types.ProxyType(this.proxyType).encode(), Encoder.u32(this.delay), Encoder.u16(this.index))
  }
}

export class KillPure extends addHeader(PALLET_ID, 5) {
  constructor(
    public spawner: MultiAddress,
    public proxyType: types.ProxyTypeValue,
    public index: number, // u16
    public height: number, // Compact<u32>
    public extIndex: number, // Compact<u32>
  ) {
    super()
  }

  static decode(decoder: Decoder): KillPure | AvailError {
    const value = decoder.any5(MultiAddress, types.ProxyType, U16, CompactU32, CompactU32)
    if (value instanceof AvailError) return value

    return new KillPure(...value)
  }

  encode(): Uint8Array {
    return u8aConcat(
      Encoder.any1(this.spawner),
      new types.ProxyType(this.proxyType).encode(),
      Encoder.u16(this.index),
      Encoder.u32(this.height, true),
      Encoder.u32(this.extIndex, true),
    )
  }
}
