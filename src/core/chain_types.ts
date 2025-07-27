import Encoder from "./encoder"
import Decoder from "./decoder"
import { CompactU32 } from "./coded_types"
import { BN, GeneralError, MultiAddress } from "."
import { Hex, mergeArrays } from "./utils"
import { GenericExtrinsic } from "@polkadot/types"
import { Encodable, HasTxDispatchIndex } from "./decode_transaction"

class RuntimeCall {
  public BalancesTransferKeepAlive: balances.tx.TransferKeepAlive | null = null

  public constructor() {}

  public static decode(decoder: Decoder): RuntimeCall | GeneralError {
    const palletId = decoder.u8()
    const callId = decoder.u8()

    const runtimeCall = new RuntimeCall()
    if (palletId == balances.PALLET_INDEX) {
      if (callId == balances.tx.TransferKeepAlive.dispatchIndex()[1]) {
        const decoded = balances.tx.TransferKeepAlive.decode(decoder)
        if (decoded instanceof GeneralError) {
          return decoded
        }

        runtimeCall.BalancesTransferKeepAlive = decoded
        return runtimeCall
      }
    }

    return new GeneralError("Failed to decode runtime call")
  }
}

export namespace dataAvailability {
  export const PALLET_NAME: string = "dataAvailability"
  export const PALLET_INDEX: number = 29

  export namespace tx {
    export class CreateApplicationKey {
      constructor(public key: Uint8Array) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "createApplicationKey"

      encode(): Uint8Array {
        return Encoder.arrayU8(this.key)
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return CreateApplicationKey.dispatchIndex()
      }

      static decode(decoder: Decoder): CreateApplicationKey | GeneralError {
        const value = decoder.arrayU8()
        if (value instanceof GeneralError) {
          return value
        }
        return new CreateApplicationKey(value)
      }
    }

    export class SubmitData {
      constructor(public data: Uint8Array) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "submitData"

      encode(): Uint8Array {
        return Encoder.arrayU8(this.data)
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 1]
      }

      dispatchIndex(): [number, number] {
        return SubmitData.dispatchIndex()
      }

      static decode(decoder: Decoder): SubmitData | GeneralError {
        const value = decoder.arrayU8()
        if (value instanceof GeneralError) {
          return value
        }
        return new SubmitData(value)
      }
    }
  }
}

export namespace timestamp {
  export const PALLET_NAME: string = "timestamp"
  export const PALLET_INDEX: number = 3

  export namespace tx {
    export class Set {
      constructor(public now: BN) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "set"

      encode(): Uint8Array {
        return Encoder.u64(this.now, true)
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return Set.dispatchIndex()
      }

      static decode(decoder: Decoder): Set | GeneralError {
        const value = decoder.u64(true)
        if (value instanceof GeneralError) {
          return value
        }

        return new Set(value)
      }
    }
  }
}

export namespace vector {
  export const PALLET_NAME: string = "vector"
  export const PALLET_INDEX: number = 39

  export namespace tx {
    export class FailedSendMessageTxs {
      constructor(public failedTxs: number[]) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "failedSendMessageTxs"

      encode(): Uint8Array {
        return Encoder.array(this.failedTxs.map((x) => new CompactU32(x)))
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 11]
      }

      dispatchIndex(): [number, number] {
        return FailedSendMessageTxs.dispatchIndex()
      }

      static decode(decoder: Decoder): FailedSendMessageTxs | GeneralError {
        const value = decoder.array(CompactU32)
        if (value instanceof GeneralError) {
          return value
        }

        return new FailedSendMessageTxs(value)
      }
    }
  }
}

export namespace utility {
  export const PALLET_NAME: string = "utility"
  export const PALLET_INDEX: number = 1

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

      public static create(): Batch {
        return new Batch(0, new Uint8Array())
      }

      public decodeCalls(): RuntimeCall[] | GeneralError {
        if (this._length == 0) {
          return []
        }

        const runtimeCalls = []
        const decoder = new Decoder(this._calls)
        for (let i = 0; i < this._length; ++i) {
          const decoded = RuntimeCall.decode(decoder)
          if (decoded instanceof GeneralError) {
            return decoded
          }
          runtimeCalls.push(decoded)
        }

        if (decoder.remainingLen() > 0) {
          return new GeneralError("Failed to decode batch calls")
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

      public addHex(value: string): null | GeneralError {
        const decoded = Hex.decode(value)
        if (decoded instanceof GeneralError) {
          return decoded
        }
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

      static decode(decoder: Decoder): Batch | GeneralError {
        const length = decoder.u32(true)
        if (length instanceof GeneralError) {
          return length
        }
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

      public static create(): BatchAll {
        return new BatchAll(0, new Uint8Array())
      }

      public decodeCalls(): RuntimeCall[] | GeneralError {
        if (this._length == 0) {
          return []
        }

        const runtimeCalls = []
        const decoder = new Decoder(this._calls)
        for (let i = 0; i < this._length; ++i) {
          const decoded = RuntimeCall.decode(decoder)
          if (decoded instanceof GeneralError) {
            return decoded
          }
          runtimeCalls.push(decoded)
        }

        if (decoder.remainingLen() > 0) {
          return new GeneralError("Failed to decode batch-all calls")
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

      public addHex(value: string): null | GeneralError {
        const decoded = Hex.decode(value)
        if (decoded instanceof GeneralError) {
          return decoded
        }
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
        return Batch.dispatchIndex()
      }

      static decode(decoder: Decoder): BatchAll | GeneralError {
        const length = decoder.u32(true)
        if (length instanceof GeneralError) {
          return length
        }
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

      public static create(): ForceBatch {
        return new ForceBatch(0, new Uint8Array())
      }

      public decodeCalls(): RuntimeCall[] | GeneralError {
        if (this._length == 0) {
          return []
        }

        const runtimeCalls = []
        const decoder = new Decoder(this._calls)
        for (let i = 0; i < this._length; ++i) {
          const decoded = RuntimeCall.decode(decoder)
          if (decoded instanceof GeneralError) {
            return decoded
          }
          runtimeCalls.push(decoded)
        }

        if (decoder.remainingLen() > 0) {
          return new GeneralError("Failed to decode force-batch calls")
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

      public addHex(value: string): null | GeneralError {
        const decoded = Hex.decode(value)
        if (decoded instanceof GeneralError) {
          return decoded
        }
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
        return Batch.dispatchIndex()
      }

      static decode(decoder: Decoder): ForceBatch | GeneralError {
        const length = decoder.u32(true)
        if (length instanceof GeneralError) {
          return length
        }
        const calls = decoder.remainingBytes()
        return new ForceBatch(length, calls)
      }
    }
  }
}

export namespace balances {
  export const PALLET_NAME: string = "balances"
  export const PALLET_INDEX: number = 6

  export namespace tx {
    export class TransferKeepAlive {
      constructor(
        public dest: MultiAddress,
        public value: BN,
      ) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "createApplicationKey"

      encode(): Uint8Array {
        return mergeArrays([Encoder.any(this.dest), Encoder.u128(this.value, true)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 3]
      }

      dispatchIndex(): [number, number] {
        return TransferKeepAlive.dispatchIndex()
      }

      static decode(decoder: Decoder): TransferKeepAlive | GeneralError {
        const dest = MultiAddress.decode(decoder)
        if (dest instanceof GeneralError) {
          return dest
        }
        const value = decoder.u128(true)
        if (value instanceof GeneralError) {
          return value
        }

        return new TransferKeepAlive(dest, value)
      }
    }
  }
}
