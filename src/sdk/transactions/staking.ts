import { BN } from "@polkadot/util"
import { Transaction } from "./../transaction"
import { commissionNumberToPerbill } from "../utils"
import { Client } from "../client"

type ValidatorPerfs = { commission: string; blocked: boolean }
export type StakingRewardDestination = "Staked" | "Stash" | "None" | { account: string }

export class Staking {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  bond(value: BN, payee: StakingRewardDestination): Transaction {
    const tx = this.client.api.tx.staking.bond(value, payee)
    return new Transaction(this.client, tx)
  }

  bondExtra(maxAdditional: BN): Transaction {
    const tx = this.client.api.tx.staking.bondExtra(maxAdditional)
    return new Transaction(this.client, tx)
  }

  chill(): Transaction {
    const tx = this.client.api.tx.staking.chill()
    return new Transaction(this.client, tx)
  }

  chillOther(stash: string): Transaction {
    const tx = this.client.api.tx.staking.chillOther(stash)
    return new Transaction(this.client, tx)
  }

  nominate(targets: string[]): Transaction {
    const tx = this.client.api.tx.staking.nominate(targets)
    return new Transaction(this.client, tx)
  }

  unbond(value: BN): Transaction {
    const tx = this.client.api.tx.staking.unbond(value)
    return new Transaction(this.client, tx)
  }

  validate(commission: number, blocked: boolean): Transaction {
    const maybeCommission = commissionNumberToPerbill(commission)
    if (maybeCommission.isErr()) throw Error(maybeCommission.error)

    const validatorPerfs = { commission: maybeCommission.value, blocked } as ValidatorPerfs
    const tx = this.client.api.tx.staking.validate(validatorPerfs)
    return new Transaction(this.client, tx)
  }

  payoutStakers(validatorStash: string, era: number): Transaction {
    const tx = this.client.api.tx.staking.payoutStakers(validatorStash, era)
    return new Transaction(this.client, tx)
  }
}
