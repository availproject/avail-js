import { GenericExtrinsic } from "@polkadot/types"
import { Address, H256, SignedBlock } from "@polkadot/types/interfaces/runtime"
import { fromHexToAscii } from "./utils"
import { Client } from "./client"
import { BN } from "."
import { Era } from "@polkadot/types/interfaces"
import { EventRecords } from "./transactions/events"

export interface Filter {
  appId?: number
  txHash?: H256 | string
  txIndex?: number
  /// Should be in S58 address format
  txSigner?: string
}

export class Block {
  client: Client
  psignedBlock: SignedBlock
  pevents: EventRecords | null

  constructor(client: Client, block: SignedBlock, events: EventRecords | null) {
    this.client = client
    this.psignedBlock = block
    this.pevents = events
  }

  static async New(client: Client, blockHash: H256 | string): Promise<Block> {
    const block = await client.rpcBlockAt(blockHash)
    const events = await EventRecords.fetch(client, blockHash)
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

  events(): EventRecords | null {
    return this.pevents
  }

  signedBlock(): SignedBlock {
    return this.psignedBlock
  }

  transactions(filter?: Filter): BlockTransaction[] {
    const result: BlockTransaction[] = [];

    for (const [i, genTx] of this.psignedBlock.block.extrinsics.entries()) {
      const tx = new BlockTransaction(genTx, i)

      if (filter != undefined && filter.appId != undefined) {
        const value = tx.appId()
        if (value == undefined || value != filter.appId) {
          continue
        }
      }

      if (filter != undefined && filter.txHash != undefined) {
        const value = tx.txHash()
        if (value == undefined || value != filter.txHash) {
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
        if (value == undefined || value != filter.txSigner) {
          continue
        }
      }

      result.push(tx)
    }

    return result;
  }


  dataSubmissions(filter?: Filter): DataSubmission[] {
    const result: DataSubmission[] = [];

    for (const [i, genTx] of this.psignedBlock.block.extrinsics.entries()) {
      const tx = new BlockTransaction(genTx, i)

      if (filter != undefined && filter.appId != undefined) {
        const value = tx.appId()
        if (value == undefined || value != filter.appId) {
          continue
        }
      }

      if (filter != undefined && filter.txHash != undefined) {
        const value = tx.txHash()
        if (value == undefined || value != filter.txHash) {
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
        if (value == undefined || value != filter.txSigner) {
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
}

export class BlockTransaction {
  public inner: GenericExtrinsic
  private ptxIndex: number
  constructor(genTx: GenericExtrinsic, txIndex: number) {
    this.inner = genTx
    this.ptxIndex = txIndex
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
    return this.inner.hash
  }

  txIndex(): number {
    return this.ptxIndex
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
    if (this.palletName() != "dataAvailability" && this.callName() != "submitData") {
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

export function transactionHashToIndex(block: SignedBlock, txHash: H256): number | undefined {
  for (const [index, tx] of block.block.extrinsics.entries()) {
    if (tx.hash.toHex() == txHash.toHex()) {
      return index
    }
  }
  return undefined
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
