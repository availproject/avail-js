import ClientError from "../error"
import { Decoder } from "../types/scale"
import { HasPalletInfo } from "./pallet_info"

export { IEvent } from "./event"
export { ITransactionCall } from "./transaction_call"
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

export interface IDecodableTransactionCall<T> extends Decodable<T>, HasPalletInfo {}
export interface IEncodableTransactionCall extends Encodable, HasPalletInfo {}
export interface IDecodableEvent<T> extends Decodable<T>, HasPalletInfo {}
export interface IEncodableEvent extends Encodable, HasPalletInfo {}
