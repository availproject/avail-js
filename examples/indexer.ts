import { SDK, Block, H256, UnsubscribePromise } from "./../src/index"

export async function runIndexer() {
  const sdk = await SDK.New(SDK.turingEndpoint)
  const indexer = new Indexer(sdk)
  indexer.run(Kind.Manual)

  // Fetching blocks in procedural way
  const sub = await indexer.subscribe()
  for (let i = 0; i < 3; i++) {
    const block = await sub.fetch()
    console.log(`Current: Block Height: ${block.height}, Block Hash: ${block.hash}`)
  }

  // Fetching historical blocks
  sub.blockHeight = sub.blockHeight - 100
  for (let i = 0; i < 3; i++) {
    const block = await sub.fetch()
    console.log(`Historical: Block Height: ${block.height}, Block Hash: ${block.hash}`)
  }

  // Callback
  const sub2 = await indexer.callback(callback)
  await sleep(25000)

  sub2.stop()
  await indexer.stop()
}

async function callback(block: IndexedBlock) {
  console.log(`Callback: Block Height: ${block.height}, Block Hash: ${block.hash}`)
}

interface IndexedBlock {
  hash: H256
  height: number
  block: Block
}

enum Kind {
  Manual,
  Stream,
}

class Indexer {
  sdk: SDK
  block: IndexedBlock | null
  unsub: UnsubscribePromise | null
  shutdown: boolean

  constructor(sdk: SDK) {
    this.sdk = sdk
    this.block = null
    this.unsub = null
    this.shutdown = false
  }

  public async run(kind: Kind) {
    if (this.unsub != null) {
      return
    }

    if (kind == Kind.Manual) {
      console.log("Manual")
      this.taskManual()
    } else if (kind == Kind.Stream) {
      console.log("Stream")
      this.taskStream()
    }
  }

  public async taskManual() {
    new Promise(() => {
      ;(async () => {
        for (;;) {
          if (this.shutdown) {
            return
          }

          const hash = await this.sdk.client.finalizedBlockHash()
          if (this.block != null && this.block.hash == hash) {
            await sleep(15000)
            continue
          }

          const height = await this.sdk.client.blockNumber(hash)
          const block = await Block.New(this.sdk.client, hash)
          this.block = { hash: hash, height: height, block }
        }
      })()
    })
  }

  public async taskStream() {
    const unsub = this.sdk.client.api.rpc.chain.subscribeFinalizedHeads(async (header) => {
      const height = header.number.toNumber()
      const hash = await this.sdk.client.blockHash(header.number.toNumber())
      const block = await Block.New(this.sdk.client, hash)

      this.block = { hash: hash, height: height, block }
    })

    this.unsub = unsub
  }

  public async getBlock(blockHeight: number): Promise<IndexedBlock> {
    for (;;) {
      if (this.block == null) {
        await sleep(1000)
        continue
      }
      const block = this.block

      if (this.shutdown) {
        return block
      }

      if (blockHeight > block.height) {
        await sleep(15000)
        continue
      }

      if (blockHeight == block.height) {
        return { ...block }
      }

      const oldHash = await this.sdk.client.blockHash(blockHeight)
      const oldBlock = await Block.New(this.sdk.client, oldHash)

      return { hash: oldHash, height: blockHeight, block: oldBlock }
    }
  }

  public async subscribe(): Promise<Subscription> {
    for (;;) {
      if (this.block == null) {
        await sleep(1000)
        continue
      }

      return new Subscription(this, this.block.height)
    }
  }

  public async callback(fn: (arg0: IndexedBlock) => Promise<void>): Promise<Subscription> {
    const sub = await this.subscribe()

    new Promise(() => {
      ;(async () => {
        for (;;) {
          const block = await sub.fetch()
          if (sub.state.shutdown == true) {
            return
          }

          await fn(block)
        }
      })()
    })

    return sub
  }

  public async stop() {
    this.shutdown = true
    if (this.unsub != null) {
      ;(await this.unsub)()
    }
    this.unsub = null
  }
}

class Subscription {
  private indexer: Indexer
  blockHeight: number
  state: { shutdown: boolean }

  constructor(indexer: Indexer, blockHeight: number) {
    this.indexer = indexer
    this.blockHeight = blockHeight
    this.state = { shutdown: false }
  }

  public async fetch(): Promise<IndexedBlock> {
    let block = this.indexer.getBlock(this.blockHeight)
    this.blockHeight += 1
    return block
  }

  public stop() {
    this.state.shutdown = true
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
