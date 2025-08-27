import { Encoder, Decoder } from "./../../scale"
import ClientError from "../../../error"
import { addHeader } from "../../../interface"
import { PALLET_ID } from "."

export class CreateApplicationKey extends addHeader(PALLET_ID, 0) {
  constructor(public key: Uint8Array) {
    super()
  }

  static decode(decoder: Decoder): CreateApplicationKey | ClientError {
    const value = decoder.vecU8()
    if (value instanceof ClientError) return value

    return new CreateApplicationKey(value)
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.key)
  }
}

export class SubmitData extends addHeader(PALLET_ID, 1) {
  constructor(public data: Uint8Array) {
    super()
  }

  static decode(decoder: Decoder): SubmitData | ClientError {
    const value = decoder.vecU8()
    if (value instanceof ClientError) return value

    return new SubmitData(value)
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.data)
  }
}
