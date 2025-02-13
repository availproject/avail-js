import { Transaction } from "./../transaction"
import { Client } from "../client"

export interface SessionKeys {
  babe: string
  grandpa: string
  imOnline: string
  authorityDiscovery: string
}

export class Session {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  setKeys(keys: SessionKeys): Transaction {
    const tx = this.client.api.tx.session.setKeys(keys, [])
    return new Transaction(this.client, tx)
  }
}
