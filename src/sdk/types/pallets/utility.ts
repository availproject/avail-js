import { GenericExtrinsic, u8aConcat } from "./../polkadot"
import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { Hex, mergeArrays } from "../../utils"
import { DispatchError, DispatchErrorValue, DispatchResult, DispatchResultValue } from "./../metadata"
import { addPalletInfo, IEncodableTransactionCall, ITransactionCall } from "./../../interface"
import { RuntimeCall, RuntimeCallValue } from "."

export const PALLET_NAME: string = "utility"
export const PALLET_ID: number = 1

export namespace events {
  /// Batch of dispatches did not complete fully. Index of first failing dispatch given, as
  /// well as the error.
  export class BatchInterrupted extends addPalletInfo(PALLET_ID, 0) {
    constructor(
      public index: number, // u32
      public error: DispatchErrorValue,
    ) {
      super()
    }

    static decode(decoder: Decoder): BatchInterrupted | ClientError {
      const index = decoder.u32()
      if (index instanceof ClientError) return index

      const error = decoder.any1(DispatchError)
      if (error instanceof ClientError) return error

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
  export class BatchCompleted extends addPalletInfo(PALLET_ID, 1) {
    constructor() {
      super()
    }

    static decode(_decoder: Decoder): BatchCompleted | ClientError {
      return new BatchCompleted()
    }

    encode(): Uint8Array {
      return new Uint8Array()
    }
  }

  /// Batch of dispatches completed but has error
  export class BatchCompletedWithErrors extends addPalletInfo(PALLET_ID, 2) {
    constructor() {
      super()
    }

    static decode(_decoder: Decoder): BatchCompletedWithErrors | ClientError {
      return new BatchCompletedWithErrors()
    }

    encode(): Uint8Array {
      return new Uint8Array()
    }
  }

  /// A single item within a Batch of dispatches has completed with no error
  export class ItemCompleted extends addPalletInfo(PALLET_ID, 3) {
    constructor() {
      super()
    }

    static decode(_decoder: Decoder): ItemCompleted | ClientError {
      return new ItemCompleted()
    }

    encode(): Uint8Array {
      return new Uint8Array()
    }
  }

  /// A single item within a Batch of dispatches has completed with error.
  export class ItemFailed extends addPalletInfo(PALLET_ID, 4) {
    constructor(public error: DispatchErrorValue) {
      super()
    }

    encode(): Uint8Array {
      return Encoder.any1(new DispatchError(this.error))
    }

    static decode(decoder: Decoder): ItemFailed | ClientError {
      const error = decoder.any1(DispatchError)
      if (error instanceof ClientError) return error

      return new ItemFailed(error.value)
    }
  }

  /// A call was dispatched.
  export class DispatchedAs extends addPalletInfo(PALLET_ID, 5) {
    constructor(public result: DispatchResultValue) {
      super()
    }

    encode(): Uint8Array {
      return Encoder.any1(new DispatchResult(this.result))
    }

    static decode(decoder: Decoder): DispatchedAs | ClientError {
      const result = decoder.any1(DispatchResult)
      if (result instanceof ClientError) return result

      return new DispatchedAs(result.value)
    }
  }
}

export namespace tx {
  export class Batch extends addPalletInfo(PALLET_ID, 0) {
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

    public decodeCalls(): RuntimeCallValue[] | ClientError {
      if (this._length == 0) return []

      const runtimeCalls = []
      const decoder = new Decoder(this._calls)
      for (let i = 0; i < this._length; ++i) {
        const decoded = RuntimeCall.decode(decoder)
        if (decoded instanceof ClientError) return decoded

        runtimeCalls.push(decoded)
      }

      if (decoder.remainingLen() > 0) return new ClientError("Failed to decode batch calls")

      return runtimeCalls.map((x) => x.value)
    }

    public push(value: Uint8Array | IEncodableTransactionCall | GenericExtrinsic | string) {
      if (typeof value === "string") {
        const decoded = Hex.decode(value)
        if (decoded instanceof ClientError) throw decoded
        value = decoded
      } else if ("PALLET_ID" in value) {
        value = ITransactionCall.encode(value)
      } else if ("method" in value) {
        value = value.method.toU8a()
      }

      this._length += 1
      this._calls = u8aConcat(this._calls, value)
    }

    public length(): number {
      return this._length
    }

    public calls(): Uint8Array {
      return this._calls
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.u32(this._length, true), this._calls])
    }

    static decode(decoder: Decoder): Batch | ClientError {
      const length = decoder.u32(true)
      if (length instanceof ClientError) return length

      const calls = decoder.remainingBytes()
      return new Batch(length, calls)
    }
  }

  export class BatchAll extends addPalletInfo(PALLET_ID, 2) {
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

    public decodeCalls(): RuntimeCallValue[] | ClientError {
      if (this._length == 0) {
        return []
      }

      const runtimeCalls = []
      const decoder = new Decoder(this._calls)
      for (let i = 0; i < this._length; ++i) {
        const decoded = RuntimeCall.decode(decoder)
        if (decoded instanceof ClientError) return decoded

        runtimeCalls.push(decoded)
      }

      if (decoder.remainingLen() > 0) {
        return new ClientError("Failed to decode batch-all calls")
      }

      return runtimeCalls.map((x) => x.value)
    }

    public push(value: Uint8Array | IEncodableTransactionCall | GenericExtrinsic | string) {
      if (typeof value === "string") {
        const decoded = Hex.decode(value)
        if (decoded instanceof ClientError) throw decoded
        value = decoded
      } else if ("PALLET_ID" in value) {
        value = ITransactionCall.encode(value)
      } else if ("method" in value) {
        value = value.method.toU8a()
      }

      this._length += 1
      this._calls = u8aConcat(this._calls, value)
    }

    public length(): number {
      return this._length
    }

    public calls(): Uint8Array {
      return this._calls
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.u32(this._length, true), this._calls])
    }

    static decode(decoder: Decoder): BatchAll | ClientError {
      const length = decoder.u32(true)
      if (length instanceof ClientError) return length

      const calls = decoder.remainingBytes()
      return new BatchAll(length, calls)
    }
  }

  export class ForceBatch extends addPalletInfo(PALLET_ID, 4) {
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

    public decodeCalls(): RuntimeCallValue[] | ClientError {
      if (this._length == 0) {
        return []
      }

      const runtimeCalls = []
      const decoder = new Decoder(this._calls)
      for (let i = 0; i < this._length; ++i) {
        const decoded = RuntimeCall.decode(decoder)
        if (decoded instanceof ClientError) return decoded

        runtimeCalls.push(decoded)
      }

      if (decoder.remainingLen() > 0) {
        return new ClientError("Failed to decode force-batch calls")
      }

      return runtimeCalls.map((x) => x.value)
    }

    public push(value: Uint8Array | IEncodableTransactionCall | GenericExtrinsic | string) {
      if (typeof value === "string") {
        const decoded = Hex.decode(value)
        if (decoded instanceof ClientError) throw decoded
        value = decoded
      } else if ("PALLET_ID" in value) {
        value = ITransactionCall.encode(value)
      } else if ("method" in value) {
        value = value.method.toU8a()
      }

      this._length += 1
      this._calls = u8aConcat(this._calls, value)
    }

    public length(): number {
      return this._length
    }

    public calls(): Uint8Array {
      return this._calls
    }

    encode(): Uint8Array {
      return mergeArrays([Encoder.u32(this._length, true), this._calls])
    }

    static decode(decoder: Decoder): ForceBatch | ClientError {
      const length = decoder.u32(true)
      if (length instanceof ClientError) return length

      const calls = decoder.remainingBytes()
      return new ForceBatch(length, calls)
    }
  }
}
