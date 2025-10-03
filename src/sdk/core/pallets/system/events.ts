import { addHeader } from "./../../interface"
import { Encoder, Decoder } from "./../../scale"
import { AvailError } from "../../zero_dep/error"
import { mergeArrays } from "../../zero_dep/utils"
import { DispatchError, DispatchInfo } from "../../metadata"
import { PALLET_ID } from "./header"

export class ExtrinsicSuccess extends addHeader(PALLET_ID, 0) {
  constructor(public dispatchInfo: DispatchInfo) {
    super()
  }

  static decode(decoder: Decoder): ExtrinsicSuccess | AvailError {
    const dispatchInfo = decoder.any1(DispatchInfo)
    if (dispatchInfo instanceof AvailError) return dispatchInfo

    return new ExtrinsicSuccess(dispatchInfo)
  }

  encode(): Uint8Array {
    return Encoder.any1(this.dispatchInfo)
  }
}

export class ExtrinsicFailed extends addHeader(PALLET_ID, 1) {
  constructor(
    public dispatchError: DispatchError,
    public dispatchInfo: DispatchInfo,
  ) {
    super()
  }

  static decode(decoder: Decoder): ExtrinsicFailed | AvailError {
    const dispatchError = decoder.any1(DispatchError)
    if (dispatchError instanceof AvailError) return dispatchError

    const dispatchInfo = decoder.any1(DispatchInfo)
    if (dispatchInfo instanceof AvailError) return dispatchInfo

    return new ExtrinsicFailed(dispatchError, dispatchInfo)
  }

  encode(): Uint8Array {
    return mergeArrays([Encoder.any1(this.dispatchError), Encoder.any1(this.dispatchInfo)])
  }
}
