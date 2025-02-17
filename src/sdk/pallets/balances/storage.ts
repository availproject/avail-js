import { BN } from "../.."
import { QueryableStorage } from "@polkadot/api/types"
import { Codec } from "@polkadot/types-codec/types"
import { AccountId } from "@polkadot/types/interfaces"

export class TotalIssuance {
  constructor() { }

  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<BN> {
    const value = await storageAt.balances.totalIssuance()
    return value as unknown as BN
  }
}

export class InactiveIssuance {
  constructor() { }

  static async fetch(storageAt: QueryableStorage<'promise'>): Promise<BN> {
    const value = await storageAt.balances.inactiveIssuance()
    return value as unknown as BN
  }
}

/* export class BalanceLock {
  constructor(public id: Uint8Array, public amount: BN, public reasons: Reasons) { }
  static fromCodec(enc: Codec): BalanceLock {
    let id = decodeScale((enc as any)["id"] as Codec, new Uint8Array())
    let amount = decodeScale((enc as any)["amount"] as Codec, new BN(0))
    let reasons = ((enc as any)["reasons"] as Codec).toU8a()[0]
    return new BalanceLock(id, amount, new Reasons(reasons))
  }
}
export class Locks {
  static async fetch(storageAt: QueryableStorage<'promise'>, account: AccountId): Promise<BalanceLock[]> {
    const result: BalanceLock[] = []

    const array = await storageAt.balances.locks(account) as unknown as Codec[]
    for (const elem of array) {
      result.push(BalanceLock.fromCodec(elem as Codec))
    }

    return result
  }

  static async fetchAll(storageAt: QueryableStorage<'promise'>): Promise<BalanceLock[]> {
    const result: BalanceLock[] = []

    const entries = await storageAt.balances.locks.entries()
    for (const entry of entries) {
      const key = entry[0]
      console.log(key.toHuman())
      const value = entry[1] as unknown as Codec[]
      for (const elem of value) {
        //result.push(BalanceLock.fromCodec(elem as Codec))
      }
    }

    return result
  }
}

export class Reasons {
  constructor(public variantIndex: number) { }
  toString(): string {
    switch (this.variantIndex) {
      case 0:
        return "Fee"
      case 1:
        return "Misc"
      case 2:
        return "All"
      default:
        throw new Error("Unknown Reasons variant")
    }
  }
}




function decodeScale<T>(enc: Codec, dummy: T): T {
  if (dummy instanceof Uint8Array) {
    if (enc.toRawType() == "[u8;8]") {
      return enc.toU8a() as T
    }
  }


  if (dummy instanceof BN) {
    if (enc.toRawType() == "u128") {
      return enc as T
    }
  }


  const message = `Don't know to decode it: ${enc.toRawType()}`
  throw new Error(message)
} */