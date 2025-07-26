import Encoder from "./encoder"
import Decoder from "./decoder"
import { VecU8 } from "./coded_types"

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
        return Encoder.encodeBytesWLen(this.key)
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
        return Encoder.encodeBytesWLen(this.data)
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

export namespace Utility {
  export const PALLET_NAME: string = "utility"
  export const PALLET_INDEX: number = 1

  export namespace Storage {}
  export namespace Types {}
  export namespace Events {}
  export namespace Tx {
    export class Batch {
      constructor(public calls: Uint8Array[]) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "createApplicationKey"

      encode(): Uint8Array {
        return Encoder.array(this.calls.map((x) => new VecU8(x)))
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return Batch.dispatchIndex()
      }

      static decode(decoder: Decoder): Batch | null {
        const value = decoder.array(VecU8)
        return new Batch(value)
      }
    }
  }
}
