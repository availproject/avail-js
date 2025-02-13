import { BN } from "@polkadot/util"
import { Transaction } from "./../transaction"
import { commissionNumberToPerbill } from "../utils"
import { Client } from "../client"

export interface BondExtra {
  FreeBalance?: BN
  Rewards?: null
}

export type ClaimPermission = "Permissioned" | "PermissionlessCompound" | "PermissionlessWithdraw" | "PermissionlessAll"
export type PoolState = "Open" | "Blocked" | "Destroying"

export interface NewCommission {
  amount: number
  payee: string
}

export class NominationPools {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  create(amount: BN, root: string, nominator: string, bouncer: string): Transaction {
    const tx = this.client.api.tx.nominationPools.create(amount, root, nominator, bouncer)
    return new Transaction(this.client, tx)
  }

  createWithPoolId(amount: BN, root: string, nominator: string, bouncer: string, poolId: number): Transaction {
    const tx = this.client.api.tx.nominationPools.createWithPoolId(amount, root, nominator, bouncer, poolId)
    return new Transaction(this.client, tx)
  }

  join(amount: BN, poolId: number): Transaction {
    const tx = this.client.api.tx.nominationPools.join(amount, poolId)
    return new Transaction(this.client, tx)
  }

  nominate(poolId: number, validators: string[]): Transaction {
    const tx = this.client.api.tx.nominationPools.nominate(poolId, validators)
    return new Transaction(this.client, tx)
  }

  bondExtra(extra: BondExtra): Transaction {
    const tx = this.client.api.tx.nominationPools.bondExtra(extra)
    return new Transaction(this.client, tx)
  }

  setMetadata(poolId: number, metadata: string): Transaction {
    const tx = this.client.api.tx.nominationPools.setMetadata(poolId, metadata)
    return new Transaction(this.client, tx)
  }

  unbond(memberAccount: string, unbondingPoints: BN): Transaction {
    const tx = this.client.api.tx.nominationPools.unbond(memberAccount, unbondingPoints)
    return new Transaction(this.client, tx)
  }

  chill(poolId: number): Transaction {
    const tx = this.client.api.tx.nominationPools.chill(poolId)
    return new Transaction(this.client, tx)
  }

  claimCommission(poolId: number): Transaction {
    const tx = this.client.api.tx.nominationPools.claimCommission(poolId)
    return new Transaction(this.client, tx)
  }

  claimPayout(): Transaction {
    const tx = this.client.api.tx.nominationPools.claimPayout()
    return new Transaction(this.client, tx)
  }

  claimPayoutOther(other: string): Transaction {
    const tx = this.client.api.tx.nominationPools.claimPayoutOther(other)
    return new Transaction(this.client, tx)
  }

  setClaimPermission(permission: ClaimPermission): Transaction {
    const tx = this.client.api.tx.nominationPools.setClaimPermission(permission)
    return new Transaction(this.client, tx)
  }

  setCommission(poolId: number, newCommission: NewCommission | null): Transaction {
    let commission: string[] | null = null
    if (newCommission != null) {
      const amount = commissionNumberToPerbill(newCommission.amount)
      if (amount.isErr()) throw Error(amount.error)

      commission = [amount.value, newCommission.payee]
    }

    const tx = this.client.api.tx.nominationPools.setCommission(poolId, commission)
    return new Transaction(this.client, tx)
  }

  withdrawUnbonded(memberAccount: string, numSlashingSpans: number): Transaction {
    const tx = this.client.api.tx.nominationPools.withdrawUnbonded(memberAccount, numSlashingSpans)
    return new Transaction(this.client, tx)
  }

  setState(poolId: number, state: PoolState): Transaction {
    const tx = this.client.api.tx.nominationPools.setState(poolId, state)
    return new Transaction(this.client, tx)
  }
}
