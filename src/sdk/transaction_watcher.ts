import { Header } from "@polkadot/types/interfaces"
import { H256, TransactionDetails, WaitFor, Events, Client } from "."

export class Watcher {
  private client: Client
  private txHash: H256 | string
  private blockCountTimeout: number | null
  private blockHeightTimeout: number | null
  private waitFor: WaitFor

  constructor(client: Client, txHash: H256 | string, waitFor: WaitFor) {
    this.client = client
    this.txHash = txHash
    this.blockCountTimeout = null
    this.blockHeightTimeout = null
    this.waitFor = waitFor
  }

  withBlockCountTimeout(value: number | null) {
    this.blockCountTimeout = value
  }

  withBlockHeightTimeout(value: number | null) {
    this.blockHeightTimeout = value
  }

  async run(): Promise<TransactionDetails | null> {
    const timeout = await this.determineTimeout()
    if (this.waitFor == WaitFor.BlockInclusion) {
      return await this.runIncluded(timeout)
    } else {
      return await this.runFinalized(timeout)
    }
  }

  private async determineTimeout(): Promise<number> {
    if (this.blockHeightTimeout != null) {
      return this.blockHeightTimeout
    }

    let bestBlock = await this.client.bestBlockNumber()
    if (this.blockCountTimeout != null) {
      return bestBlock + this.blockCountTimeout
    }

    return bestBlock + 5
  }

  private async runFinalized(timeout: number): Promise<TransactionDetails | null> {
    const result = await new Promise<TransactionDetails | null>(async (res, _) => {
      const unsub = await this.client.api.rpc.chain.subscribeFinalizedHeads(async (header) => {
        const details = await this.checkBlock(header)
        if (details != null) {
          unsub();
          res(details)
        }

        if (header.number.toNumber() >= timeout) {
          unsub();
          res(null)
        }
      });
    })

    return result
  }

  private async runIncluded(timeout: number): Promise<TransactionDetails | null> {
    const result = await new Promise<TransactionDetails | null>(async (res, _) => {
      const unsub = await this.client.api.rpc.chain.subscribeNewHeads(async (header) => {
        const details = await this.checkBlock(header)
        if (details != null) {
          unsub();
          res(details)
        }

        if (header.number.toNumber() >= timeout) {
          unsub();
          res(null)
        }
      });
    })

    return result
  }

  async checkBlock(header: Header): Promise<TransactionDetails | null> {
    const blockNumber = header.number.toNumber()
    const blockHash = await this.client.blockHash(header.number.toNumber())
    const block = await this.client.rpcBlockAt(blockHash)
    console.log(`Block Number: ${header.number.toNumber()}, Block Hash: ${blockHash}`)

    let txIndex = 0
    for (const ext of block.block.extrinsics) {
      const txHash = ext.hash;

      if (txHash.toHex() != this.txHash.toString()) {
        txIndex += 1
        continue
      }

      let events: Events.EventRecords | null = null
      try {
        events = await Events.EventRecords.fetch(this.client, blockHash, txIndex)
      } catch (err) { }

      console.log("Found :)")
      return new TransactionDetails(this.client, events, txHash, txIndex, blockHash, blockNumber)
    }

    return null
  }
}