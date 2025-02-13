import { ApiPromise } from "@polkadot/api"
import { Balances } from "./balances"
import { Staking } from "./staking"
import { DataAvailability } from "./da"
import { NominationPools } from "./nomination_pools"
import { Multisig } from "./multisig"
import { Session } from "./session"
import { Client } from "../client"

export { DispatchFeeModifier } from "./da"
export { StakingRewardDestination } from "./staking"
export { BondExtra, ClaimPermission, NewCommission, PoolState } from "./nomination_pools"
export * as Events from "./events"
export * as CallData from "./call_data"
export { MultisigTimepoint } from "./multisig"

export class Transactions {
  private client: Client
  dataAvailability: DataAvailability
  balances: Balances
  staking: Staking
  nominationPools: NominationPools
  multisig: Multisig
  session: Session

  constructor(client: Client) {
    this.client = client
    this.dataAvailability = new DataAvailability(client)
    this.balances = new Balances(client)
    this.staking = new Staking(client)
    this.nominationPools = new NominationPools(client)
    this.multisig = new Multisig(client)
    this.session = new Session(client)
  }
}
