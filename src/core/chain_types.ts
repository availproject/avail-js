import Encoder from "./encoder"
import Decoder from "./decoder"
import { CompactU128, CompactU32, VecU8 } from "./coded_types"
import { BN, hexToU8a, MultiAddress } from "."
import { mergeArrays } from "./utils"
import { GenericExtrinsic } from "@polkadot/types"
import { Encodable, HasTxDispatchIndex } from "./decode_transaction"

class RuntimeCall {
  public BalancesTransferKeepAlive: Balances.Tx.TransferKeepAlive | null = null

  public constructor() {}

  public static decode(decoder: Decoder): RuntimeCall | null {
    const palletId = decoder.u8()
    const callId = decoder.u8()

    const runtimeCall = new RuntimeCall()
    if (palletId == Balances.PALLET_INDEX) {
      if (callId == Balances.Tx.TransferKeepAlive.dispatchIndex()[1]) {
        const decoded = Balances.Tx.TransferKeepAlive.decode(decoder)
        if (decoded == null) {
          return null
        }

        runtimeCall.BalancesTransferKeepAlive = decoded
        return runtimeCall
      }
    }

    return null
  }
}

export namespace DataAvailability {
  export const PALLET_NAME: string = "dataAvailability"
  export const PALLET_INDEX: number = 29

  export namespace Storage {}
  export namespace Types {}
  export namespace Events {}
  export namespace Tx {
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

      static decode(decoder: Decoder): CreateApplicationKey | null {
        const value = decoder.any(VecU8)
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

      static decode(decoder: Decoder): SubmitData | null {
        const value = decoder.any(VecU8)
        return new SubmitData(value)
      }
    }
  }
}

export namespace Timestamp {
  export const PALLET_NAME: string = "timestamp"
  export const PALLET_INDEX: number = 3

  export namespace Storage {}
  export namespace Types {}
  export namespace Events {}
  export namespace Tx {
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

      static decode(decoder: Decoder): Set | null {
        return new Set(decoder.u64(true))
      }
    }
  }
}

export namespace Vector {
  export const PALLET_NAME: string = "vector"
  export const PALLET_INDEX: number = 39

  export namespace Storage {}
  export namespace Types {}
  export namespace Events {}
  export namespace Tx {
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

      static decode(decoder: Decoder): FailedSendMessageTxs | null {
        return new FailedSendMessageTxs(decoder.array(CompactU32))
      }
    }
  }
}

export namespace Utility {
  export const PALLET_NAME: string = "utility"
  export const PALLET_INDEX: number = 1

  export namespace Storage {}
  export namespace Types {}
  export namespace Events {}
  export namespace Tx {
    export class Batch {
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "batch"

      private _length: number = 0 // Compact<u32>
      private _calls: Uint8Array = new Uint8Array() // Already encoded

      private constructor(length: number, calls: Uint8Array) {
        this._length = length
        this._calls = calls
      }

      public static Create(): Batch {
        return new Batch(0, new Uint8Array())
      }

      public decodeCalls(): RuntimeCall[] | null {
        if (this._length == 0) {
          return []
        }

        const runtimeCalls = []
        const decoder = new Decoder(this._calls)
        for (let i = 0; i < this._length; ++i) {
          const decoded = RuntimeCall.decode(decoder)
          if (decoded == null) {
            return decoded
          }
          runtimeCalls.push(decoded)
        }

        if (decoder.remainingLen() > 0) {
          return null
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

      public addHex(value: string) {
        const decoded = hexToU8a(value)
        this.add(decoded)
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

      static decode(decoder: Decoder): Batch | null {
        const length = decoder.u32(true)
        const calls = decoder.remainingBytes()
        return new Batch(length, calls)
      }
    }
  }
}

export namespace Balances {
  export const PALLET_NAME: string = "balances"
  export const PALLET_INDEX: number = 6

  export namespace Storage {}
  export namespace Types {}
  export namespace Events {}
  export namespace Tx {
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

      static decode(decoder: Decoder): TransferKeepAlive | null {
        const dest = decoder.any(MultiAddress)
        const value = decoder.any(CompactU128)
        return new TransferKeepAlive(dest, value)
      }
    }
  }
}
