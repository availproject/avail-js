import { addHeader } from "../."

import { u8aConcat } from "../../polkadot"
import { Encoder, Decoder } from "../../scale"
import { AvailError } from "../../../error"
import { DispatchError, DispatchErrorValue, DispatchResult, DispatchResultValue } from "../../metadata"
import { PALLET_ID } from "."

/// Batch of dispatches did not complete fully. Index of first failing dispatch given, as
/// well as the error.
export class BatchInterrupted extends addHeader(PALLET_ID, 0) {
  constructor(
    public index: number, // u32
    public error: DispatchErrorValue,
  ) {
    super()
  }

  static decode(decoder: Decoder): BatchInterrupted | AvailError {
    const index = decoder.u32()
    if (index instanceof AvailError) return index

    const error = decoder.any1(DispatchError)
    if (error instanceof AvailError) return error

    return new BatchInterrupted(index, error.value)
  }

  static encode(value: BatchInterrupted): Uint8Array {
    return u8aConcat(Encoder.u32(value.index), Encoder.any1(new DispatchError(value.error)))
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

  static decode(_decoder: Decoder): BatchCompleted | AvailError {
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

  static decode(_decoder: Decoder): BatchCompletedWithErrors | AvailError {
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

  static decode(_decoder: Decoder): ItemCompleted | AvailError {
    return new ItemCompleted()
  }

  encode(): Uint8Array {
    return new Uint8Array()
  }
}

/// A single item within a Batch of dispatches has completed with error.
export class ItemFailed extends addHeader(PALLET_ID, 4) {
  constructor(public error: DispatchErrorValue) {
    super()
  }

  encode(): Uint8Array {
    return Encoder.any1(new DispatchError(this.error))
  }

  static decode(decoder: Decoder): ItemFailed | AvailError {
    const error = decoder.any1(DispatchError)
    if (error instanceof AvailError) return error

    return new ItemFailed(error.value)
  }
}

/// A call was dispatched.
export class DispatchedAs extends addHeader(PALLET_ID, 5) {
  constructor(public result: DispatchResultValue) {
    super()
  }

  encode(): Uint8Array {
    return Encoder.any1(new DispatchResult(this.result))
  }

  static decode(decoder: Decoder): DispatchedAs | AvailError {
    const result = decoder.any1(DispatchResult)
    if (result instanceof AvailError) return result

    return new DispatchedAs(result.value)
  }
}
