import Decoder from "./decoder"
import { GeneralError } from "./error"

export interface Decodable<T> {
  decode(decoder: Decoder): T | GeneralError
}
export interface Encodable {
  encode(): Uint8Array
}
