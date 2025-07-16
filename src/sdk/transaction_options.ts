import { SignerOptions } from "@polkadot/api/types"
import { Account, BN, Client, H256 } from "."

export interface TransactionOptions {
  app_id?: number
  nonce?: number
  tip?: BN
  mortality?: number
}

export interface RefinedOptions {
  app_id?: number
  nonce: number
  tip?: BN
  forkHash: H256
  forkHeight: number
  period: number
}

export async function toRefinedOptions(
  options: TransactionOptions,
  client: Client,
  accountAddress: string,
): Promise<RefinedOptions> {
  let period = 32
  if (options.mortality != undefined) {
    period = options.mortality
  }
  const forkHeight = await client.finalizedBlockNumber()
  const forkHash = await client.blockHash(forkHeight)
  const nonce = options.nonce != undefined ? options.nonce : await Account.nonce(client, accountAddress)

  const refined: RefinedOptions = {
    app_id: options.app_id,
    tip: options.tip,
    forkHash: forkHash,
    forkHeight: forkHeight,
    period: period,
    nonce: nonce,
  }

  return refined
}

export async function toSignerOptions(refined: RefinedOptions, client: Client): Promise<Partial<SignerOptions>> {
  const txOps: Partial<SignerOptions> = {}
  ;(txOps as any).app_id = refined.app_id
  txOps.tip = refined.tip
  txOps.era = client.api.createType("ExtrinsicEra", {
    current: refined.forkHeight,
    period: refined.period,
  })
  txOps.blockHash = refined.forkHash.value
  txOps.nonce = refined.nonce

  return txOps
}
