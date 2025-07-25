import { encodeBytesWLen } from "./encoder"
import { Decoder } from "./decoder"

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
        return encodeBytesWLen(this.key)
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return CreateApplicationKey.dispatchIndex()
      }

      static decode(data: Uint8Array): CreateApplicationKey | null {
        const decoder = new Decoder(data, 0)
        const value = decoder.bytesWLen()
        return new CreateApplicationKey(value)
      }
    }

    export class SubmitData {
      constructor(public data: Uint8Array) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "submitData"

      encode(): Uint8Array {
        return encodeBytesWLen(this.data)
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 1]
      }

      dispatchIndex(): [number, number] {
        return SubmitData.dispatchIndex()
      }

      static decode(data: Uint8Array): SubmitData | null {
        const decoder = new Decoder(data, 0)
        const value = decoder.bytesWLen()
        return new SubmitData(value)
      }
    }
  }
}
