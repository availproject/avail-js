import { GenericExtrinsic } from "@polkadot/types"
import { Address, SignedBlock } from "@polkadot/types/interfaces/runtime"
import { fromHexToAscii } from "./utils"
import { BN, Events, Client, H256, AccountId } from "."
import { Era } from "@polkadot/types/interfaces"
import { EventRecords } from "./events"

export interface Filter {
  appId?: number
  txHash?: H256 | string
  txIndex?: number
  txSigner?: AccountId | string
}

export class Block {
  private client: Client
  public signedBlock: SignedBlock
  public events: Events.EventRecords | undefined

  constructor(client: Client, block: SignedBlock, events: Events.EventRecords | undefined) {
    this.client = client
    this.signedBlock = block
    this.events = events
  }

  static async New(client: Client, blockHash: Uint8Array | H256 | string): Promise<Block> {
    if (blockHash instanceof Uint8Array) {
      blockHash = new H256(blockHash).toString()
    } else if (blockHash instanceof H256) {
      blockHash = blockHash.toString()
    }

    const block = await client.rpcBlockAt(blockHash)
    const events = await Events.EventRecords.fetch(client, blockHash)
    return new Block(client, block, events)
  }

  static async NewBestBlock(client: Client): Promise<Block> {
    const blockHash = await client.bestBlockHash()
    console.log(blockHash.toHuman())
    return Block.New(client, blockHash)
  }

  static async NewFinalizedBlock(client: Client): Promise<Block> {
    const blockHash = await client.finalizedBlockHash()
    return Block.New(client, blockHash)
  }

  transactions(filter?: Filter): BlockTransaction[] {
    const result: BlockTransaction[] = [];

    for (const [i, genTx] of this.signedBlock.block.extrinsics.entries()) {
      const tx = new BlockTransaction(genTx, i)

      if (filter != undefined && filter.appId != undefined) {
        const value = tx.appId()
        if (value == undefined || value != filter.appId) {
          continue
        }
      }

      if (filter != undefined && filter.txHash != undefined) {
        const value = tx.txHash()
        if (value == undefined || value.toString() != filter.txHash.toString()) {
          continue
        }
      }

      if (filter != undefined && filter.txIndex != undefined) {
        const value = tx.txIndex()
        if (value == undefined || value != filter.txIndex) {
          continue
        }
      }

      if (filter != undefined && filter.txSigner != undefined) {
        const value = tx.ss58Address()
        if (value == undefined || value != filter.txSigner.toString()) {
          continue
        }
      }

      tx.setEvents(this.eventsForTransaction(tx.txIndex()))
      result.push(tx)
    }

    return result;
  }


  dataSubmissions(filter?: Filter): DataSubmission[] {
    const result: DataSubmission[] = [];

    for (const [i, genTx] of this.signedBlock.block.extrinsics.entries()) {
      const tx = new BlockTransaction(genTx, i)

      if (filter != undefined && filter.appId != undefined) {
        const value = tx.appId()
        if (value == undefined || value != filter.appId) {
          continue
        }
      }

      if (filter != undefined && filter.txHash != undefined) {
        const value = tx.txHash()
        if (value == undefined || value.toString() != filter.txHash.toString()) {
          continue
        }
      }

      if (filter != undefined && filter.txIndex != undefined) {
        const value = tx.txIndex()
        if (value == undefined || value != filter.txIndex) {
          continue
        }
      }

      if (filter != undefined && filter.txSigner != undefined) {
        const value = tx.ss58Address()
        if (value == undefined || value != filter.txSigner.toString()) {
          continue
        }
      }

      const blob = tx.toDataSubmission()
      if (blob == undefined) {
        continue
      }

      result.push(blob)
    }

    return result;
  }

  eventsForTransaction(txIndex: number): EventRecords | undefined {
    if (this.events == undefined) return undefined;

    if (txIndex >= this.signedBlock.block.extrinsics.length) {
      return undefined
    }

    const result = []
    for (const event of this.events.iter()) {
      if (event.txIndex() == undefined || event.txIndex() != txIndex) {
        continue
      }
      result.push(event)
    }

    return new EventRecords(result)
  }
}

export class BlockTransaction {
  private ptxIndex: number
  public inner: GenericExtrinsic
  private pevents: Events.EventRecords | undefined

  constructor(genTx: GenericExtrinsic, txIndex: number) {
    this.inner = genTx
    this.ptxIndex = txIndex
    this.pevents = undefined
  }

  palletName(): string {
    return this.inner.method.section
  }

  callName(): string {
    return this.inner.method.method
  }

  palletIndex(): number {
    return this.inner.callIndex[0]
  }

  callIndex(): number {
    return this.inner.callIndex[1]
  }

  txHash(): H256 {
    return new H256(this.inner.hash)
  }

  txIndex(): number {
    return this.ptxIndex
  }

  events(): Events.EventRecords | undefined {
    return this.pevents
  }

  setEvents(value: Events.EventRecords | undefined) {
    this.pevents = value
  }

  ss58Address(): string | undefined {
    const signer = (this.inner as any).__internal__raw.signature.signer.toString()
    if (signer == "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM") {
      return undefined
    }

    return signer
  }

  multiAddress(): Address | undefined {
    const signer = (this.inner as any).__internal__raw.signature.signer.toString()
    if (signer == "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM") {
      return undefined
    }

    return this.inner.signer
  }

  appId(): number | undefined {
    const signer = (this.inner as any).__internal__raw.signature.signer.toString()
    if (signer == "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM") {
      return undefined
    }

    return parseInt((this.inner as any).__internal__raw.signature.appId.toString())
  }

  tip(): BN | undefined {
    const signer = (this.inner as any).__internal__raw.signature.signer.toString()
    if (signer == "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM") {
      return undefined
    }

    return this.inner.tip.toBn()
  }

  mortality(): Era | undefined {
    const signer = (this.inner as any).__internal__raw.signature.signer.toString()
    if (signer == "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM") {
      return undefined
    }

    return this.inner.era
  }

  nonce(): number | undefined {
    const signer = (this.inner as any).__internal__raw.signature.signer.toString()
    if (signer == "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM") {
      return undefined
    }
    return this.inner.nonce.toNumber()
  }

  toDataSubmission(): DataSubmission | undefined {
    if (this.palletName() != "dataAvailability" || this.callName() != "submitData") {
      return undefined
    }

    let dataHex = this.inner.method.args.map((a) => a.toString()).join(", ")
    if (dataHex.startsWith("0x")) {
      dataHex = dataHex.slice(2)
    }

    let txHash = this.txHash()
    let txIndex = this.txIndex()
    let txSigner = this.ss58Address()
    let appId = this.appId()
    if (txHash == undefined || txIndex == undefined || txSigner == undefined || appId == undefined) {
      return undefined
    }

    return new DataSubmission(txHash, txIndex, dataHex, txSigner, appId)
  }
}

export class DataSubmission {
  constructor(
    public txHash: H256,
    public txIndex: number,
    public hexData: string,
    /// SS58 Address
    public txSigner: string,
    public appId: number,
  ) { }

  toAscii(): string {
    return fromHexToAscii(this.hexData)
  }
}
