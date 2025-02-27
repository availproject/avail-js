import { BN, Client } from "."

export interface TransactionOptions {
  app_id?: number
  nonce?: number
  tip?: BN
  mortality?: number
}

export async function populateMortality(client: Client, options: any) {
  if (options.mortality == undefined) {
    options.mortality = 32
  }

  // Fetch latest finalized block hash
  options.era = options.mortality
  options.blockHash = (await client.finalizedBlockHash()).toString()
}