import { u8aConcat } from "../../polkadot"
import { Encoder, Decoder } from "../../scale"
import { AvailError } from "../../../error"
import { addHeader } from "../."
import { RuntimeCall, RuntimeCallValue } from ".."
import { encodeTransactionCallLike, TransactionCallLike } from "../../../extrinsic/transaction_call"
import { PALLET_ID } from "."

export class Batch extends addHeader(PALLET_ID, 0) {
  private _length: number = 0 // Compact<u32>
  private _calls: Uint8Array = new Uint8Array() // Already encoded

  private constructor(length: number, calls: Uint8Array) {
    super()
    this._length = length
    this._calls = calls
  }

  static create(): Batch {
    return new Batch(0, new Uint8Array())
  }

  public decodeCalls(): RuntimeCallValue[] | AvailError {
    if (this._length == 0) return []

    const runtimeCalls = []
    const decoder = new Decoder(this._calls)
    for (let i = 0; i < this._length; ++i) {
      const decoded = RuntimeCall.decode(decoder)
      if (decoded instanceof AvailError) return decoded

      runtimeCalls.push(decoded)
    }

    if (decoder.remainingLen() > 0) return new AvailError("Failed to decode batch calls")

    return runtimeCalls.map((x) => x.value)
  }

  public push(value: TransactionCallLike) {
    this._length += 1
    this._calls = u8aConcat(this._calls, encodeTransactionCallLike(value))
  }

  public length(): number {
    return this._length
  }

  public calls(): Uint8Array {
    return this._calls
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.u32(this._length, true), this._calls)
  }

  static decode(decoder: Decoder): Batch | AvailError {
    const length = decoder.u32(true)
    if (length instanceof AvailError) return length

    const calls = decoder.consumeRemainingBytes()
    return new Batch(length, calls)
  }
}

export class BatchAll extends addHeader(PALLET_ID, 2) {
  private _length: number = 0 // Compact<u32>
  private _calls: Uint8Array = new Uint8Array() // Already encoded

  private constructor(length: number, calls: Uint8Array) {
    super()
    this._length = length
    this._calls = calls
  }

  static create(): BatchAll {
    return new BatchAll(0, new Uint8Array())
  }

  public decodeCalls(): RuntimeCallValue[] | AvailError {
    if (this._length == 0) {
      return []
    }

    const runtimeCalls = []
    const decoder = new Decoder(this._calls)
    for (let i = 0; i < this._length; ++i) {
      const decoded = RuntimeCall.decode(decoder)
      if (decoded instanceof AvailError) return decoded

      runtimeCalls.push(decoded)
    }

    if (decoder.remainingLen() > 0) {
      return new AvailError("Failed to decode batch-all calls")
    }

    return runtimeCalls.map((x) => x.value)
  }

  public push(value: TransactionCallLike) {
    this._length += 1
    this._calls = u8aConcat(this._calls, encodeTransactionCallLike(value))
  }

  public length(): number {
    return this._length
  }

  public calls(): Uint8Array {
    return this._calls
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.u32(this._length, true), this._calls)
  }

  static decode(decoder: Decoder): BatchAll | AvailError {
    const length = decoder.u32(true)
    if (length instanceof AvailError) return length

    const calls = decoder.consumeRemainingBytes()
    return new BatchAll(length, calls)
  }
}

export class ForceBatch extends addHeader(PALLET_ID, 4) {
  private _length: number = 0 // Compact<u32>
  private _calls: Uint8Array = new Uint8Array() // Already encoded

  private constructor(length: number, calls: Uint8Array) {
    super()
    this._length = length
    this._calls = calls
  }

  static create(): ForceBatch {
    return new ForceBatch(0, new Uint8Array())
  }

  public decodeCalls(): RuntimeCallValue[] | AvailError {
    if (this._length == 0) {
      return []
    }

    const runtimeCalls = []
    const decoder = new Decoder(this._calls)
    for (let i = 0; i < this._length; ++i) {
      const decoded = RuntimeCall.decode(decoder)
      if (decoded instanceof AvailError) return decoded

      runtimeCalls.push(decoded)
    }

    if (decoder.remainingLen() > 0) {
      return new AvailError("Failed to decode force-batch calls")
    }

    return runtimeCalls.map((x) => x.value)
  }

  public push(value: TransactionCallLike) {
    this._length += 1
    this._calls = u8aConcat(this._calls, encodeTransactionCallLike(value))
  }

  public length(): number {
    return this._length
  }

  public calls(): Uint8Array {
    return this._calls
  }

  encode(): Uint8Array {
    return u8aConcat(Encoder.u32(this._length, true), this._calls)
  }

  static decode(decoder: Decoder): ForceBatch | AvailError {
    const length = decoder.u32(true)
    if (length instanceof AvailError) return length

    const calls = decoder.consumeRemainingBytes()
    return new ForceBatch(length, calls)
  }
}
