import { addHeader } from "./../../interface"
import { u8aConcat } from "@polkadot/util"
import { Encoder } from "./../../scale/encoder"
import { Decoder } from "./../../scale/decoder"
import { DispatchError, DispatchResult } from "../../types"
import { PALLET_ID } from "./header"
import { DispatchErrorScale, DispatchResultScale } from "../../scale/types"

/// Batch of dispatches did not complete fully. Index of first failing dispatch given, as
/// well as the error.
export class BatchInterrupted extends addHeader(PALLET_ID, 0) {
  constructor(
    public index: number, // u32
    public error: DispatchError,
  ) {
    super()
  }

  static decode(decoder: Decoder): BatchInterrupted {
    const index = decoder.u32()

    const error = decoder.any1(DispatchErrorScale)

    return new BatchInterrupted(index, error)
  }

  static encode(value: BatchInterrupted): Uint8Array {
    return u8aConcat(Encoder.u32(value.index), Encoder.any1(new DispatchErrorScale(value.error)))
  }

  encode(): Uint8Array {
    return BatchInterrupted.encode(this)
  }
}

/// Batch of dispatches completed fully with no error.
export class BatchCompleted extends addHeader(PALLET_ID, 1) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): BatchCompleted {
    return new BatchCompleted()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

/// Batch of dispatches completed but has error
export class BatchCompletedWithErrors extends addHeader(PALLET_ID, 2) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): BatchCompletedWithErrors {
    return new BatchCompletedWithErrors()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

/// A single item within a Batch of dispatches has completed with no error
export class ItemCompleted extends addHeader(PALLET_ID, 3) {
  constructor() {
    super()
  }

  static decode(_decoder: Decoder): ItemCompleted {
    return new ItemCompleted()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

/// A single item within a Batch of dispatches has completed with error.
export class ItemFailed extends addHeader(PALLET_ID, 4) {
  constructor(public error: DispatchError) {
    super()
  }

  encode(): Uint8Array {
    return Encoder.any1(new DispatchErrorScale(this.error))
  }

  static decode(decoder: Decoder): ItemFailed {
    const error = decoder.any1(DispatchErrorScale)

    return new ItemFailed(error)
  }
}

/// A call was dispatched.
export class DispatchedAs extends addHeader(PALLET_ID, 5) {
  constructor(public result: DispatchResult) {
    super()
  }

  encode(): Uint8Array {
    return Encoder.any1(new DispatchResultScale(this.result))
  }

  static decode(decoder: Decoder): DispatchedAs {
    const result = decoder.any1(DispatchResultScale)

    return new DispatchedAs(result)
  }
}
