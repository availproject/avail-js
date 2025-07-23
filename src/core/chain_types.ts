import { encodeBytesWLen, encodeU8, EncodableCallT, mergeArrays, EncodableDecodableCall } from "./encoder"
import { hexStripPrefix, hexToU8a } from "@polkadot/util"
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

      encode(): Uint8Array {
        return encodeBytesWLen(this.key)
      }

      encodeCall(call: EncodableCallT): Uint8Array {
        return mergeArrays([encodeU8(PALLET_INDEX), encodeU8(SubmitData.CALL_INDEX), call.encode()])
      }

      static decode(data: Uint8Array): CreateApplicationKey | null {
        const decoder = new Decoder(data, 0)
        const value = decoder.bytesWLen()
        return new CreateApplicationKey(value)
      }

      static decodeHexCall(value: string): SubmitData | null {
        const valueWithoutPrefix = hexToU8a(hexStripPrefix(value))
        return SubmitData.decode(valueWithoutPrefix)
      }

      static decodeCall(data: Uint8Array): CreateApplicationKey | null {
        if (data[0] != PALLET_INDEX || data[1] != CreateApplicationKey.CALL_INDEX) {
          return null
        }

        return CreateApplicationKey.decode(data.slice(2))
      }
    }

    export class SubmitData {
      constructor(public data: Uint8Array) { }
      static PALLET_NAME: string = PALLET_NAME
      static PALLET_INDEX: number = PALLET_INDEX
      static CALL_NAME: string = "submitData"
      static CALL_INDEX: number = 1

      encode(): Uint8Array {
        return encodeBytesWLen(this.data)
      }

      encodeCall(call: EncodableCallT): Uint8Array {
        return mergeArrays([encodeU8(PALLET_INDEX), encodeU8(SubmitData.CALL_INDEX), call.encode()])
      }

      static decode(data: Uint8Array): SubmitData | null {
        const decoder = new Decoder(data, 0)
        const value = decoder.bytesWLen()
        return new SubmitData(value)
      }

      static decodeHexCall(value: string): SubmitData | null {
        const valueWithoutPrefix = hexToU8a(hexStripPrefix(value))
        return SubmitData.decode(valueWithoutPrefix)
      }

      static decodeCall(value: Uint8Array): SubmitData | null {
        if (value[0] != PALLET_INDEX || value[1] != SubmitData.CALL_INDEX) {
          return null
        }

        return SubmitData.decode(value.slice(2))
      }
    }
  }
}