import { SubmittableExtrinsic } from "@polkadot/api/types"
import { KeyringPair, TransactionDetails, Client, H256, Account, Events } from "."
import { RefinedOptions, toRefinedOptions, toSignerOptions, TransactionOptions } from "./transaction_options"

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
  const refinedOptions = await toRefinedOptions(options, client, account.address)
  const signerOptions = await toSignerOptions(refinedOptions, client)
  const txHash = await tx.signAndSend(account, signerOptions)

  let res = null
  if (waitFor == WaitFor.BlockFinalization) {
    res = await find_finalized_block(client, refinedOptions, account.address)
  } else {
    res = await find_best_block(client, refinedOptions, account.address)
  }

  if (res == null) {
    throw new Error("Failed to find transactions")
  }

  const details = await find_transaction(client, res[1], res[0], txHash.toHex())
  if (details != null) {
    return details
  }

  throw new Error("Failed to submit and/or find transactions")
}

export async function find_finalized_block(
  client: Client,
  refined: RefinedOptions,
  accountAddress: string,
): Promise<[H256, number] | null> {
  const mortalityEndsHeight = refined.forkHeight + refined.period
  let nextBlockHeight = refined.forkHeight + 1
  let blockHeight = await client.finalizedBlockNumber()

  while (mortalityEndsHeight > nextBlockHeight) {
    if (nextBlockHeight > blockHeight) {
      await sleep(3000)
      blockHeight = await client.finalizedBlockNumber()
      continue
    }

    const nextBlockHash = await client.blockHash(nextBlockHeight)
    const stateNonce = await Account.nonceAt(client, accountAddress, nextBlockHash)
    if (stateNonce > refined.nonce) {
      return [nextBlockHash, nextBlockHeight]
    }

    nextBlockHeight += 1
  }

  return null
}

export async function find_best_block(
  client: Client,
  refined: RefinedOptions,
  accountAddress: string,
): Promise<[H256, number] | null> {
  const mortalityEndsHeight = refined.forkHeight + refined.period
  let currentBlockHeight = refined.forkHeight
  let currentBlockHash = refined.forkHash

  let newBlockHeight = await client.bestBlockNumber()
  let newBlockHash = await client.blockHash(newBlockHeight)

  while (mortalityEndsHeight > currentBlockHeight) {
    if (currentBlockHeight > newBlockHeight || currentBlockHash == newBlockHash) {
      await sleep(3000)
      newBlockHeight = await client.bestBlockNumber()
      newBlockHash = await client.blockHash(newBlockHeight)
      continue
    }

    if (newBlockHeight == currentBlockHeight || newBlockHeight == currentBlockHeight + 1) {
      const stateNonce = await Account.nonceAt(client, accountAddress, newBlockHash)
      if (stateNonce > refined.nonce) {
        return [newBlockHash, newBlockHeight]
      }

      currentBlockHeight = newBlockHeight
      currentBlockHash = newBlockHash
      continue
    }

    currentBlockHeight += 1
    currentBlockHash = await client.blockHash(currentBlockHeight)
    const stateNonce = await Account.nonceAt(client, accountAddress, currentBlockHash)
    if (stateNonce > refined.nonce) {
      return [currentBlockHash, currentBlockHeight]
    }
  }

  return null
}

export async function find_transaction(
  client: Client,
  blockHeight: number,
  blockHash: H256,
  txHash: string,
): Promise<TransactionDetails | null> {
  const block = await client.rpcBlockAt(blockHash)

  for (let i = 0; i < block.block.extrinsics.length; ++i) {
    if (block.block.extrinsics[i].hash.toHex() != txHash) {
      continue
    }

    let events: Events.EventRecords | undefined = undefined
    try {
      events = await Events.EventRecords.fetch(client, blockHash, i)
    } catch (err) {
      // Don't do anything
    }

    return new TransactionDetails(client, events, H256.fromString(txHash), i, blockHash, blockHeight)
  }

  return null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
