import { Client, Pallets } from "."

export class Transactions {
  dataAvailability: Pallets.DataAvailabilityCalls
  balances: Pallets.BalancesCalls

  constructor(client: Client) {
    this.dataAvailability = new Pallets.DataAvailabilityCalls(client)
    this.balances = new Pallets.BalancesCalls(client)
  }
}
