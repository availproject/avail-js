import { Client, Pallets } from "."

export class Transactions {
  public dataAvailability: Pallets.DataAvailabilityCalls.Calls
  public balances: Pallets.BalancesCalls.Calls
  public utility: Pallets.UtilityCalls.Calls
  public system: Pallets.SystemCalls.Calls
  public session: Pallets.SessionCalls.Calls
  public staking: Pallets.StakingCalls.Calls
  public proxy: Pallets.ProxyCalls.Calls
  public multisig: Pallets.MultisigCalls.Calls
  public nominationPools: Pallets.NominationPoolsCalls.Calls

  constructor(client: Client) {
    this.dataAvailability = new Pallets.DataAvailabilityCalls.Calls(client)
    this.balances = new Pallets.BalancesCalls.Calls(client)
    this.utility = new Pallets.UtilityCalls.Calls(client)
    this.system = new Pallets.SystemCalls.Calls(client)
    this.session = new Pallets.SessionCalls.Calls(client)
    this.staking = new Pallets.StakingCalls.Calls(client)
    this.proxy = new Pallets.ProxyCalls.Calls(client)
    this.multisig = new Pallets.MultisigCalls.Calls(client)
    this.nominationPools = new Pallets.NominationPoolsCalls.Calls(client)
  }
}
