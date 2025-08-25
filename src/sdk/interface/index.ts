import ClientError from "../error"
import { Decoder } from "../types/scale"

export { IEvent, IDecodableEvent, IEncodableEvent } from "./event"
export { ITransactionCall, IDecodableTransactionCall, IEncodableTransactionCall } from "./transaction_call"
export { addPalletInfo, HasPalletInfo } from "./pallet_info"
export {
  makeStorageDoubleMap,
  StorageHasher,
  StorageHasherValue,
  makeStorageMap,
  makeStorageValue,
  twoX128,
} from "./storage"

export interface Decodable<T> {
  decode(decoder: Decoder): T | ClientError
}

export interface Encodable {
  encode(): Uint8Array
}

export interface Encodable2<T> {
  encode(value: T): Uint8Array
}
