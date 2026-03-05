import { addHeader } from "./../../interface"
import { Encoder, Decoder } from "./../../scale"
import { mergeArrays } from "../../utils"
import { PALLET_ID } from "./header"
import { DispatchError, DispatchInfo } from "../../types"
import { DispatchErrorScale, DispatchInfoScale } from "../../scale/types"

export class ExtrinsicSuccess extends addHeader(PALLET_ID, 0) {
  constructor(public dispatchInfo: DispatchInfo) {
    super()
  }

  static decode(decoder: Decoder): ExtrinsicSuccess {
    const dispatchInfo = decoder.any1(DispatchInfoScale)
    return new ExtrinsicSuccess(dispatchInfo)
  }

  encode(): Uint8Array {
    return DispatchInfoScale.encode(this.dispatchInfo)
  }
}

export class ExtrinsicFailed extends addHeader(PALLET_ID, 1) {
  constructor(
    public dispatchError: DispatchError,
    public dispatchInfo: DispatchInfo,
  ) {
    super()
  }

  static decode(decoder: Decoder): ExtrinsicFailed {
    const dispatchError = decoder.any1(DispatchErrorScale)
    const dispatchInfo = decoder.any1(DispatchInfoScale)

    return new ExtrinsicFailed(dispatchError, dispatchInfo)
  }

  encode(): Uint8Array {
    return mergeArrays([DispatchErrorScale.encode(this.dispatchError), DispatchInfoScale.encode(this.dispatchInfo)])
  }
}
