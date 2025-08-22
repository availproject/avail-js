import { Decodable, IDecodableEvent, IEncodableEvent } from "."
import ClientError from "../error"
import { u8aConcat } from "../types/polkadot"
import { Decoder, Encoder } from "../types/scale"
import { Hex } from "../utils"

export class IEvent {
  static decode<T>(type: IDecodableEvent<T>, value: Decoder | Uint8Array | string): T | null {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return null

    const palletId = decoder.byte()
    if (palletId instanceof ClientError || type.PALLET_ID != palletId) return null

    const variantId = decoder.byte()
    if (variantId instanceof ClientError || type.VARIANT_ID != variantId) return null

    const decoded = type.decode(decoder)
    if (decoded instanceof ClientError) return null
    return decoded
  }

  static decodeData<T>(type: Decodable<T>, value: Decoder | Uint8Array | string): T | null {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return null

    const decoded = type.decode(decoder)
    if (decoded instanceof ClientError) return null

    return decoded
  }

  static encode(value: IEncodableEvent): Uint8Array {
    return u8aConcat(Encoder.u8(value.PALLET_ID), Encoder.u8(value.VARIANT_ID), value.encode())
  }

  static hexEncode(value: IEncodableEvent): string {
    return Hex.encode(IEvent.encode(value))
  }
}
