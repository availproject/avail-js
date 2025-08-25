import { Decodable, Encodable, HasPalletInfo } from "."
import ClientError from "../error"
import { OpaqueTransaction } from "../transaction"
import { u8aConcat } from "../types/polkadot"
import { Decoder, Encoder } from "../types/scale"
import { Hex } from "../utils"

export interface IDecodableTransactionCall<T> extends Decodable<T>, HasPalletInfo {}
export interface IEncodableTransactionCall extends Encodable, HasPalletInfo {}

export class ITransactionCall {
  static decode<T>(as: IDecodableTransactionCall<T>, value: Decoder | string | Uint8Array): T | null {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return null

    const palletId = decoder.byte()
    if (palletId instanceof ClientError || palletId != as.PALLET_ID) return null

    const variantId = decoder.byte()
    if (variantId instanceof ClientError || variantId != as.VARIANT_ID) return null

    const decoded = as.decode(decoder)
    if (decoded instanceof ClientError) return null

    return decoded
  }

  static decodeData<T>(as: Decodable<T>, value: Decoder | string | Uint8Array): T | null {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return null

    const decoded = as.decode(decoder)
    if (decoded instanceof ClientError) return null

    return decoded
  }

  static decodeTransaction<T>(as: IDecodableTransactionCall<T>, value: Decoder | string | Uint8Array): T | null {
    const decoder = Decoder.from(value)
    if (decoder instanceof ClientError) return null

    const opaque = OpaqueTransaction.decode(decoder)
    if (opaque instanceof ClientError) return null

    return ITransactionCall.decode(as, opaque.call)
  }

  static encode(value: IEncodableTransactionCall): Uint8Array {
    return u8aConcat(Encoder.u8(value.PALLET_ID), Encoder.u8(value.VARIANT_ID), value.encode())
  }

  static hexEncode(value: IEncodableTransactionCall): string {
    return Hex.encode(ITransactionCall.encode(value))
  }
}
