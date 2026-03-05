import { addHeader } from "./../../interface"
import { MultiAddress } from "../../types"
import { CompactU32, U16, U32, Encoder, Decoder } from "./../../scale"
import { u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"
import * as types from "./types"
import { MultiAddressScale } from "../../scale/types"

export { PALLET_ID }

export class Proxy extends addHeader(PALLET_ID, 0) {
  constructor(
    public id: MultiAddress,
    public forceProxyType: types.ProxyTypeValue | null, // Option<ProxyType>
    public call: Uint8Array,
  ) {
    super()
  }

  static decode(decoder: Decoder): Proxy {
    const id = MultiAddressScale.decode(decoder)

    const forceProxyType = decoder.option(types.ProxyType)

    const call = decoder.consumeRemainingBytes()

    return new Proxy(id, forceProxyType, call)
  }

  encode(): Uint8Array {
    return u8aConcat(
      Encoder.any1(new MultiAddressScale(this.id)),
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

  static decode(decoder: Decoder): AddProxy {
    const result = decoder.any3(MultiAddressScale, types.ProxyType, U32)

    return new AddProxy(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(
      Encoder.any1(new MultiAddressScale(this.id)),
      new types.ProxyType(this.proxyType).encode(),
      Encoder.u32(this.delay),
    )
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

  static decode(decoder: Decoder): RemoveProxy {
    const result = decoder.any3(MultiAddressScale, types.ProxyType, U32)

    return new RemoveProxy(...result)
  }

  encode(): Uint8Array {
    return u8aConcat(
      Encoder.any1(new MultiAddressScale(this.delegate)),
      new types.ProxyType(this.proxyType).encode(),
      Encoder.u32(this.delay),
    )
  }
}

export class RemoveProxies extends addHeader(PALLET_ID, 3) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): RemoveProxies {
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

  static decode(decoder: Decoder): CreatePure {
    const result = decoder.any3(types.ProxyType, U32, U16)

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

  static decode(decoder: Decoder): KillPure {
    const value = decoder.any5(MultiAddressScale, types.ProxyType, U16, CompactU32, CompactU32)

    return new KillPure(...value)
  }

  encode(): Uint8Array {
    return u8aConcat(
      Encoder.any1(new MultiAddressScale(this.spawner)),
      new types.ProxyType(this.proxyType).encode(),
      Encoder.u16(this.index),
      Encoder.u32(this.height, true),
      Encoder.u32(this.extIndex, true),
    )
  }
}
