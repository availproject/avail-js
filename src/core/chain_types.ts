import { encodeBytesWLen, EncodableDecodableCall } from "./encoder"
import { Decoder } from "./decoder"

export namespace DataAvailability {
  export const PALLET_NAME: string = "dataAvailability"
  export const PALLET_INDEX: number = 29

  export namespace Storage { }
  export namespace Types { }
  export namespace Events { }
  export namespace Tx {

    export class CreateApplicationKey {
      constructor(public key: Uint8Array) { }
      static PALLET_NAME: string = PALLET_NAME
      static PALLET_INDEX: number = PALLET_INDEX
      static CALL_NAME: string = "createApplicationKey"
      static CALL_INDEX: number = 0

      dispatchIndex(): [number, number] {
        return [PALLET_INDEX, SubmitData.CALL_INDEX]
      }

      encodeData(): Uint8Array {
        return encodeBytesWLen(this.key)
      }

      decodeData(data: Uint8Array): SubmitData | null {
        const decoder = new Decoder(data, 0)
        const value = decoder.bytesWLen()
        return new SubmitData(value)
      }
    }

    export class SubmitData extends EncodableDecodableCall<SubmitData> {
      constructor(public data: Uint8Array) { super() }
      static PALLET_NAME: string = PALLET_NAME
      static PALLET_INDEX: number = PALLET_INDEX
      static CALL_NAME: string = "submitData"
      static CALL_INDEX: number = 1

      dispatchIndex(): [number, number] {
        return [PALLET_INDEX, SubmitData.CALL_INDEX]
      }

      encodeData(): Uint8Array {
        return encodeBytesWLen(this.data)
      }

      decodeData(data: Uint8Array): SubmitData | null {
        const decoder = new Decoder(data, 0)
        const value = decoder.bytesWLen()
        return new SubmitData(value)
      }
    }
  }
}