import { Encoder, Decoder } from "../../scale"
import { ClientError } from "../../../error"
import { mergeArrays } from "../../../utils"
import { DispatchError, DispatchInfo } from "../../metadata"
import { addHeader } from "../."
import { PALLET_ID } from "."

export class ExtrinsicSuccess extends addHeader(PALLET_ID, 0) {
  constructor(public dispatchInfo: DispatchInfo) {
    super()
  }

  static decode(decoder: Decoder): ExtrinsicSuccess | ClientError {
    const dispatchInfo = decoder.any1(DispatchInfo)
    if (dispatchInfo instanceof ClientError) return dispatchInfo

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

  static decode(decoder: Decoder): ExtrinsicFailed | ClientError {
    const dispatchError = decoder.any1(DispatchError)
    if (dispatchError instanceof ClientError) return dispatchError

    const dispatchInfo = decoder.any1(DispatchInfo)
    if (dispatchInfo instanceof ClientError) return dispatchInfo

    return new ExtrinsicFailed(dispatchError, dispatchInfo)
  }

  encode(): Uint8Array {
    return mergeArrays([Encoder.any1(this.dispatchError), Encoder.any1(this.dispatchInfo)])
  }
}
