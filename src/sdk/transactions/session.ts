import { ApiPromise } from "@polkadot/api"
import { Transaction } from "./../transaction"

export interface SessionKeys {
  babe: string
  grandpa: string
  imOnline: string
  authorityDiscovery: string
}

export class Session {
  private api: ApiPromise

  constructor(api: ApiPromise) {
    this.api = api
  }

  setKeys(keys: SessionKeys): Transaction {
    const tx = this.api.tx.session.setKeys(keys, [])
    return new Transaction(this.api, tx)
  }
}
