import { GenericExtrinsic, u8aConcat } from "./../polkadot"
import { Encoder, Decoder } from "./../scale"
import ClientError from "../../error"
import { Hex, mergeArrays } from "../../utils"
import { DispatchError, DispatchResult } from "./../metadata"
import { addPalletInfo, Encodable, HasPalletInfo } from "./../../interface"
import { RuntimeCall, RuntimeCallValue } from "."

export const PALLET_NAME: string = "utility"
export const PALLET_INDEX: number = 1

export namespace events {
  export class BatchInterrupted extends addPalletInfo(PALLET_INDEX, 0) {
    constructor(
      public index: number, // u32
      public error: DispatchError,
    ) {
      super()
    }

    static encode(value: BatchInterrupted): Uint8Array {
      return u8aConcat(Encoder.u32(value.index), Encoder.any1(value.error))
    }

    encode(): Uint8Array {
      return BatchInterrupted.encode(this)
    }

    static decode(decoder: Decoder): BatchInterrupted | ClientError {
      const index = decoder.u32()
      if (index instanceof ClientError) return index

      const error = decoder.any1(DispatchError)
      if (error instanceof ClientError) return error

      return new BatchInterrupted(index, error)
    }
  }

  export class BatchCompleted extends addPalletInfo(PALLET_INDEX, 1) {
    constructor() {
      super()
    }

    encode(): Uint8Array {
      return new Uint8Array()
    }

    static decode(_decoder: Decoder): BatchCompleted | ClientError {
      return new BatchCompleted()
    }
  }

  export class BatchCompletedWithErrors extends addPalletInfo(PALLET_INDEX, 2) {
    constructor() {
      super()
    }

    encode(): Uint8Array {
      return new Uint8Array()
    }

    static decode(_decoder: Decoder): BatchCompletedWithErrors | ClientError {
      return new BatchCompletedWithErrors()
    }
  }

  export class ItemCompleted extends addPalletInfo(PALLET_INDEX, 3) {
    constructor() {
      super()
    }

    encode(): Uint8Array {
      return new Uint8Array()
    }

    static decode(_decoder: Decoder): ItemCompleted | ClientError {
      return new ItemCompleted()
    }
  }

  export class ItemFailed extends addPalletInfo(PALLET_INDEX, 4) {
    constructor(public error: DispatchError) {
      super()
    }

    encode(): Uint8Array {
      return Encoder.any1(this.error)
    }

    static decode(decoder: Decoder): ItemFailed | ClientError {
      const error = decoder.any1(DispatchError)
      if (error instanceof ClientError) return error

      return new ItemFailed(error)
    }
  }

  export class DispatchedAs extends addPalletInfo(PALLET_INDEX, 5) {
    constructor(public error: DispatchResult) {
      super()
    }

    encode(): Uint8Array {
      return Encoder.any1(this.error)
    }

    static decode(decoder: Decoder): DispatchedAs | ClientError {
      const error = decoder.any1(DispatchResult)
      if (error instanceof ClientError) return error

      return new DispatchedAs(error)
    }
  }
}

export namespace tx {
  export class Batch extends addPalletInfo(PALLET_INDEX, 0) {
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

      return runtimeCalls.map((x) => x.value)
    }

    public addGenericExt(value: GenericExtrinsic) {
      this.add(value.method.toU8a())
    }

    public addCall(T: Encodable & HasPalletInfo) {
      const encodedCallData = T.encode()
      this.add(mergeArrays([Encoder.u8(T.PALLET_ID), Encoder.u8(T.VARIANT_ID), encodedCallData]))
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

    static decode(decoder: Decoder): Batch | ClientError {
      const length = decoder.u32(true)
      if (length instanceof ClientError) return length

      const calls = decoder.remainingBytes()
      return new Batch(length, calls)
    }
  }

  export class BatchAll extends addPalletInfo(PALLET_INDEX, 2) {
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

    public addGenericExt(value: GenericExtrinsic) {
      this.add(value.method.toU8a())
    }

    public addCall(T: Encodable & HasPalletInfo) {
      const encodedCallData = T.encode()
      this.add(mergeArrays([Encoder.u8(T.PALLET_ID), Encoder.u8(T.VARIANT_ID), encodedCallData]))
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

    static decode(decoder: Decoder): BatchAll | ClientError {
      const length = decoder.u32(true)
      if (length instanceof ClientError) return length

      const calls = decoder.remainingBytes()
      return new BatchAll(length, calls)
    }
  }

  export class ForceBatch extends addPalletInfo(PALLET_INDEX, 4) {
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

    public addGenericExt(value: GenericExtrinsic) {
      this.add(value.method.toU8a())
    }

    public addCall(T: Encodable & HasPalletInfo) {
      const encodedCallData = T.encode()
      this.add(mergeArrays([Encoder.u8(T.PALLET_ID), Encoder.u8(T.VARIANT_ID), encodedCallData]))
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

    static decode(decoder: Decoder): ForceBatch | ClientError {
      const length = decoder.u32(true)
      if (length instanceof ClientError) return length

      const calls = decoder.remainingBytes()
      return new ForceBatch(length, calls)
    }
  }
}
