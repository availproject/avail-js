import { GenericExtrinsic } from "./../polkadot"
import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { Hex, mergeArrays } from "../../utils"
import { DispatchError, DispatchResult } from "./../metadata"
import { Encodable, HasTxDispatchIndex } from "./../../interface"
import { RuntimeCall } from "."

export const PALLET_NAME: string = "utility"
export const PALLET_INDEX: number = 1

export namespace events {
  export class BatchInterrupted {
    constructor(
      public index: number, // u32
      public error: DispatchError,
    ) {}

    encode(): Uint8Array {
      return mergeArrays([Encoder.u32(this.index), Encoder.any(this.error)])
    }

    static emittedIndex(): [number, number] {
      return [PALLET_INDEX, 0]
    }

    emittedIndex(): [number, number] {
      return BatchInterrupted.emittedIndex()
    }

    static decode(decoder: Decoder): BatchInterrupted | ClientError {
      const index = decoder.u32()
      if (index instanceof ClientError) return index

      const error = decoder.any(DispatchError)
      if (error instanceof ClientError) return error

      return new BatchInterrupted(index, error)
    }
  }

  export class BatchCompleted {
    constructor() {}

    encode(): Uint8Array {
      return new Uint8Array()
    }

    static emittedIndex(): [number, number] {
      return [PALLET_INDEX, 1]
    }

    emittedIndex(): [number, number] {
      return BatchCompleted.emittedIndex()
    }

    static decode(_decoder: Decoder): BatchCompleted | ClientError {
      return new BatchCompleted()
    }
  }

  export class BatchCompletedWithErrors {
    constructor() {}

    encode(): Uint8Array {
      return new Uint8Array()
    }

    static emittedIndex(): [number, number] {
      return [PALLET_INDEX, 2]
    }

    emittedIndex(): [number, number] {
      return BatchCompletedWithErrors.emittedIndex()
    }

    static decode(_decoder: Decoder): BatchCompletedWithErrors | ClientError {
      return new BatchCompletedWithErrors()
    }
  }

  export class ItemCompleted {
    constructor() {}

    encode(): Uint8Array {
      return new Uint8Array()
    }

    static emittedIndex(): [number, number] {
      return [PALLET_INDEX, 3]
    }

    emittedIndex(): [number, number] {
      return ItemCompleted.emittedIndex()
    }

    static decode(_decoder: Decoder): ItemCompleted | ClientError {
      return new ItemCompleted()
    }
  }

  export class ItemFailed {
    constructor(public error: DispatchError) {}

    encode(): Uint8Array {
      return Encoder.any(this.error)
    }

    static emittedIndex(): [number, number] {
      return [PALLET_INDEX, 4]
    }

    emittedIndex(): [number, number] {
      return ItemFailed.emittedIndex()
    }

    static decode(decoder: Decoder): ItemFailed | ClientError {
      const error = decoder.any(DispatchError)
      if (error instanceof ClientError) return error

      return new ItemFailed(error)
    }
  }

  export class DispatchedAs {
    constructor(public error: DispatchResult) {}

    encode(): Uint8Array {
      return Encoder.any(this.error)
    }

    static emittedIndex(): [number, number] {
      return [PALLET_INDEX, 5]
    }

    emittedIndex(): [number, number] {
      return DispatchedAs.emittedIndex()
    }

    static decode(decoder: Decoder): DispatchedAs | ClientError {
      const error = decoder.any(DispatchResult)
      if (error instanceof ClientError) return error

      return new DispatchedAs(error)
    }
  }
}

export namespace tx {
  export class Batch {
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "batch"

    private _length: number = 0 // Compact<u32>
    private _calls: Uint8Array = new Uint8Array() // Already encoded

    private constructor(length: number, calls: Uint8Array) {
      this._length = length
      this._calls = calls
    }

    static create(): Batch {
      return new Batch(0, new Uint8Array())
    }

    public decodeCalls(): RuntimeCall[] | ClientError {
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
        return new ClientError("Failed to decode batch calls")
      }

      return runtimeCalls
    }

    public addGenericExt(value: GenericExtrinsic) {
      this.add(value.method.toU8a())
    }

    public addCall(T: Encodable & HasTxDispatchIndex) {
      const palletId = T.dispatchIndex()[0]
      const callId = T.dispatchIndex()[1]
      const encodedCallData = T.encode()
      this.add(mergeArrays([Encoder.u8(palletId), Encoder.u8(callId), encodedCallData]))
    }

    public addHex(value: string): null | ClientError {
      const decoded = Hex.decode(value)
      if (decoded instanceof ClientError) return decoded

      this.add(decoded)
      return null
    }

    public add(value: Uint8Array) {
      this._length += 1
      this._calls = mergeArrays([this._calls, value])
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

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 0]
    }

    dispatchIndex(): [number, number] {
      return Batch.dispatchIndex()
    }

    static decode(decoder: Decoder): Batch | ClientError {
      const length = decoder.u32(true)
      if (length instanceof ClientError) return length

      const calls = decoder.remainingBytes()
      return new Batch(length, calls)
    }
  }

  export class BatchAll {
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "batchAll"

    private _length: number = 0 // Compact<u32>
    private _calls: Uint8Array = new Uint8Array() // Already encoded

    private constructor(length: number, calls: Uint8Array) {
      this._length = length
      this._calls = calls
    }

    static create(): BatchAll {
      return new BatchAll(0, new Uint8Array())
    }

    public decodeCalls(): RuntimeCall[] | ClientError {
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

      return runtimeCalls
    }

    public addGenericExt(value: GenericExtrinsic) {
      this.add(value.method.toU8a())
    }

    public addCall(T: Encodable & HasTxDispatchIndex) {
      const palletId = T.dispatchIndex()[0]
      const callId = T.dispatchIndex()[1]
      const encodedCallData = T.encode()
      this.add(mergeArrays([Encoder.u8(palletId), Encoder.u8(callId), encodedCallData]))
    }

    public addHex(value: string): null | ClientError {
      const decoded = Hex.decode(value)
      if (decoded instanceof ClientError) return decoded

      this.add(decoded)
      return null
    }

    public add(value: Uint8Array) {
      this._length += 1
      this._calls = mergeArrays([this._calls, value])
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

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 2]
    }

    dispatchIndex(): [number, number] {
      return BatchAll.dispatchIndex()
    }

    static decode(decoder: Decoder): BatchAll | ClientError {
      const length = decoder.u32(true)
      if (length instanceof ClientError) return length

      const calls = decoder.remainingBytes()
      return new BatchAll(length, calls)
    }
  }

  export class ForceBatch {
    static PALLET_NAME: string = PALLET_NAME
    static CALL_NAME: string = "forceBatch"

    private _length: number = 0 // Compact<u32>
    private _calls: Uint8Array = new Uint8Array() // Already encoded

    private constructor(length: number, calls: Uint8Array) {
      this._length = length
      this._calls = calls
    }

    static create(): ForceBatch {
      return new ForceBatch(0, new Uint8Array())
    }

    public decodeCalls(): RuntimeCall[] | ClientError {
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

      return runtimeCalls
    }

    public addGenericExt(value: GenericExtrinsic) {
      this.add(value.method.toU8a())
    }

    public addCall(T: Encodable & HasTxDispatchIndex) {
      const palletId = T.dispatchIndex()[0]
      const callId = T.dispatchIndex()[1]
      const encodedCallData = T.encode()
      this.add(mergeArrays([Encoder.u8(palletId), Encoder.u8(callId), encodedCallData]))
    }

    public addHex(value: string): null | ClientError {
      const decoded = Hex.decode(value)
      if (decoded instanceof ClientError) return decoded

      this.add(decoded)
      return null
    }

    public add(value: Uint8Array) {
      this._length += 1
      this._calls = mergeArrays([this._calls, value])
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

    static dispatchIndex(): [number, number] {
      return [PALLET_INDEX, 2]
    }

    dispatchIndex(): [number, number] {
      return ForceBatch.dispatchIndex()
    }

    static decode(decoder: Decoder): ForceBatch | ClientError {
      const length = decoder.u32(true)
      if (length instanceof ClientError) return length

      const calls = decoder.remainingBytes()
      return new ForceBatch(length, calls)
    }
  }
}
