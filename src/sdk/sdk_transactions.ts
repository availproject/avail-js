import { Client, Pallets } from "."

export class Transactions {
  public dataAvailability: Pallets.DataAvailabilityCalls
  public balances: Pallets.BalancesCalls
  public utility: Pallets.UtilityCalls
  public system: Pallets.SystemCalls
  public session: Pallets.SessionCalls
  public staking: Pallets.StakingCalls
  public proxy: Pallets.ProxyCalls

  constructor(client: Client) {
    this.dataAvailability = new Pallets.DataAvailabilityCalls(client)
    this.balances = new Pallets.BalancesCalls(client)
    this.utility = new Pallets.UtilityCalls(client)
    this.system = new Pallets.SystemCalls(client)
    this.session = new Pallets.SessionCalls(client)
    this.staking = new Pallets.StakingCalls(client)
    this.proxy = new Pallets.ProxyCalls(client)
  }
}
