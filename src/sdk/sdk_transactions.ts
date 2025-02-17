import { Client, Pallets } from "."

export class Transactions {
  dataAvailability: Pallets.DataAvailabilityCalls
  balances: Pallets.BalancesCalls
  utility: Pallets.UtilityCalls

  constructor(client: Client) {
    this.dataAvailability = new Pallets.DataAvailabilityCalls(client)
    this.balances = new Pallets.BalancesCalls(client)
    this.utility = new Pallets.UtilityCalls(client)
  }
}
