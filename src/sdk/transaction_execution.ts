import { SubmittableExtrinsic } from "@polkadot/api/types"
import { KeyringPair, TransactionDetails, Watcher, Client } from "."
import { populateMortality, TransactionOptions } from "./transaction_options"

export enum WaitFor {
  BlockInclusion,
  BlockFinalization,
}

export async function signAndSendTransaction(
  client: Client,
  tx: SubmittableExtrinsic<"promise">,
  account: KeyringPair,
  waitFor: WaitFor,
  options: TransactionOptions,
): Promise<TransactionDetails> {
  let retryCount = 3
  for (;;) {
    await populateMortality(client, options)
    const txHash = await tx.signAndSend(account, options)
    const watcher = new Watcher(client, txHash, waitFor)
    const details = await watcher.run()
    if (details != null) {
      return details
    }

    if (retryCount == 0) {
      break
    }

    retryCount -= 1
  }

  throw new Error("Failed to submit and/or find transactions")
}
