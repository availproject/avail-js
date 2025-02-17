import { BN } from "../.."
import { Decoder } from "../decoder"

export class AccountData {
  public free: BN
  public reserved: BN
  public frozen: BN
  public flags: BN
  constructor(decoder: Decoder) {
    this.free = decoder.decodeU128()
    this.reserved = decoder.decodeU128()
    this.frozen = decoder.decodeU128()
    this.flags = decoder.decodeU128()
  }
}