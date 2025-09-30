import { addHeader } from "../utils"

import { Encoder, Decoder } from "../../scale"
import { AvailError } from "../../../error"
import { PALLET_ID } from "."

export class Remark extends addHeader(PALLET_ID, 0) {
  constructor(
    public remark: Uint8Array, // Vec<u8>,
  ) {
    super()
  }

  static decode(decoder: Decoder): Remark | AvailError {
    const remark = decoder.vecU8()
    if (remark instanceof AvailError) return remark

    return new Remark(remark)
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.remark)
  }
}

export class SetCode extends addHeader(PALLET_ID, 2) {
  constructor(
    public code: Uint8Array, // Vec<u8>,
  ) {
    super()
  }

  static decode(decoder: Decoder): SetCode | AvailError {
    const code = decoder.vecU8()
    if (code instanceof AvailError) return code

    return new SetCode(code)
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.code)
  }
}

export class SetCodeWithoutChecks extends addHeader(PALLET_ID, 3) {
  constructor(
    public code: Uint8Array, // Vec<u8>,
  ) {
    super()
  }

  static decode(decoder: Decoder): SetCodeWithoutChecks | AvailError {
    const code = decoder.vecU8()
    if (code instanceof AvailError) return code

    return new SetCodeWithoutChecks(code)
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.code)
  }
}

export class RemarkWithEvent extends addHeader(PALLET_ID, 7) {
  constructor(
    public remark: Uint8Array, // Vec<u8>,
  ) {
    super()
  }

  static decode(decoder: Decoder): RemarkWithEvent | AvailError {
    const remark = decoder.vecU8()
    if (remark instanceof AvailError) return remark

    return new RemarkWithEvent(remark)
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.remark)
  }
}
