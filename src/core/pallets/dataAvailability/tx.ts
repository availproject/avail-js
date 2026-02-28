import { addHeader } from "./../../interface"
import { AvailError } from "../../error"
import { CompactU32, VecU8, Encoder, Decoder } from "./../../scale"
import { u8aConcat } from "@polkadot/util"
import { PALLET_ID } from "./header"

export { PALLET_ID }

export class CreateApplicationKey extends addHeader(PALLET_ID, 0) {
  constructor(public key: Uint8Array) {
    super()
  }

  static decode(decoder: Decoder): CreateApplicationKey | AvailError {
    const value = decoder.vecU8()
    if (value instanceof AvailError) return value

    return new CreateApplicationKey(value)
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.key)
  }
}

export class SubmitData extends addHeader(PALLET_ID, 1) {
  constructor(
    public appId: number,
    public data: Uint8Array,
  ) {
    super()
  }

  static decode(decoder: Decoder): SubmitData | AvailError {
    const result = decoder.any2(CompactU32, VecU8)
    if (result instanceof AvailError) return result

    const appId = result[0]
    const data = result[1]

    return new SubmitData(appId, data)
  }

  encode(): Uint8Array {
    return u8aConcat(new CompactU32(this.appId).encode(), Encoder.vecU8(this.data))
  }
}
