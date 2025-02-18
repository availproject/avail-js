import { BN } from "../.."
import { QueryableStorage } from "@polkadot/api/types"
import { Decoder } from "../../decoder"

export class TotalIssuance {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<BN> {
    const value = await storageAt.balances.totalIssuance()
    const decoder = new Decoder(value.toU8a(true), 0)
    return decoder.decodeU128()
  }
}

export class InactiveIssuance {
  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<BN> {
    const value = await storageAt.balances.inactiveIssuance()
    const decoder = new Decoder(value.toU8a(true), 0)
    return decoder.decodeU128()
  }
}
