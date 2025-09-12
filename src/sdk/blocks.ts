import { ClientError } from "./error"
import { H256 } from "./types"
import { BlockRef } from "./types/metadata"
import { Client } from "./clients/main_client"
import { IHeaderAndDecodable } from "./interface"
import { EncodeSelector, ExtrinsicInfo } from "./rpc/system/fetch_extrinsics"
import { Block, BlockExtOptsBase, BlockExtOptsExtended, BlockExtrinsic } from "./block"

export class Blocks {
  ext: BExt
  tx: BTx

  constructor(client: Client, start: number, end: number) {
    this.ext = new BExt(client, start, end)
    this.tx = new BTx(this.ext)
  }
}

export interface BlockExtrinsicInfoSingle {
  ref: BlockRef
  extrinsic: ExtrinsicInfo
}

export interface BlockExtrinsicInfo {
  ref: BlockRef
  extrinsics: ExtrinsicInfo[]
}

export interface BlockTransactionSingle<T> {
  ref: BlockRef
  transaction: BlockExtrinsic<T>
}

export interface BlockTransaction<T> {
  ref: BlockRef
  transactions: BlockExtrinsic<T>[]
}

class BTx {
  constructor(private bExt: BExt) {}

  async get<T>(
    as: IHeaderAndDecodable<T>,
    txHash: H256 | string,
    retryOnError: boolean = true,
  ): Promise<BlockTransactionSingle<T> | null | ClientError> {
    const opts: BlockExtOptsExtended = {
      filter: { TxHash: [txHash.toString()] },
      encodeAs: "Extrinsic",
      retryOnError: retryOnError,
    }

    const bxi = await this.bExt.first(opts)
    if (bxi instanceof ClientError) return bxi
    if (bxi === null) return null

    const transaction = BlockExtrinsic.from(as, bxi.extrinsic, bxi.ref.hash)
    if (transaction instanceof ClientError) return transaction

    return { ref: bxi.ref, transaction }
  }

  async first<T>(
    as: IHeaderAndDecodable<T>,
    opts?: BlockExtOptsBase,
  ): Promise<BlockTransactionSingle<T> | null | ClientError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockExtOptsExtended = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "Extrinsic"

    const bxi = await this.bExt.first(opts2)
    if (bxi instanceof ClientError) return bxi
    if (bxi === null) return null

    const transaction = BlockExtrinsic.from(as, bxi.extrinsic, bxi.ref.hash)
    if (transaction instanceof ClientError) return transaction

    return { ref: bxi.ref, transaction }
  }

  async last<T>(
    as: IHeaderAndDecodable<T>,
    opts?: BlockExtOptsBase,
  ): Promise<BlockTransactionSingle<T> | null | ClientError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockExtOptsExtended = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "Extrinsic"

    const bxi = await this.bExt.last(opts2)
    if (bxi instanceof ClientError) return bxi
    if (bxi === null) return null

    const transaction = BlockExtrinsic.from(as, bxi.extrinsic, bxi.ref.hash)
    if (transaction instanceof ClientError) return transaction

    return { ref: bxi.ref, transaction }
  }

  async all<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOptsBase): Promise<BlockTransaction<T>[] | ClientError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockExtOptsExtended = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "Extrinsic"

    const bxis = await this.bExt.all(opts2)
    if (bxis instanceof ClientError) return bxis

    const result: BlockTransaction<T>[] = []
    for (const bxi of bxis) {
      const transactions: BlockExtrinsic<T>[] = []
      for (const info of bxi.extrinsics) {
        const transaction = BlockExtrinsic.from(as, info, bxi.ref.hash)
        if (transaction instanceof ClientError) return transaction
        transactions.push(transaction)
      }
      result.push({ ref: bxi.ref, transactions })
    }

    return result
  }

  async count<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOptsBase): Promise<number | ClientError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockExtOptsExtended = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "None"

    const res = await this.bExt.all(opts2)
    if (res instanceof ClientError) return res

    return res.length
  }

  async exists<T>(as: IHeaderAndDecodable<T>, opts?: BlockExtOptsBase): Promise<boolean | ClientError> {
    opts = opts === undefined ? {} : opts
    const opts2: BlockExtOptsExtended = opts

    if (opts2.filter === undefined) {
      opts2.filter = { PalletCall: [[as.palletId(), as.variantId()]] }
    }
    opts2.encodeAs = "None"

    const res = await this.bExt.first(opts2)
    if (res instanceof ClientError) return res

    return res != null
  }
}

class BExt {
  constructor(
    private client: Client,
    private start: number,
    private end: number,
  ) {}

  async get(
    txHash: H256 | string,
    encodeAs?: EncodeSelector,
    retryOnError: boolean = true,
  ): Promise<BlockExtrinsicInfoSingle | null | ClientError> {
    return await this.first({ filter: { TxHash: [txHash.toString()] }, encodeAs, retryOnError })
  }

  async first(opts?: BlockExtOptsExtended): Promise<BlockExtrinsicInfoSingle | null | ClientError> {
    for (let pos = this.start; pos < this.end; ++pos) {
      const blockHash = await this.client.blockHash(pos)
      if (blockHash instanceof ClientError) return blockHash
      if (blockHash === null) return new ClientError("No block hash found")

      const blockRef: BlockRef = { hash: blockHash, height: pos }
      const extrinsic = await new Block(this.client, blockRef.hash).rxt.first(opts)
      if (extrinsic instanceof ClientError) return extrinsic
      if (extrinsic === null) continue

      return { ref: blockRef, extrinsic }
    }

    return null
  }

  async last(opts?: BlockExtOptsExtended): Promise<BlockExtrinsicInfoSingle | null | ClientError> {
    for (let pos = this.end - 1; pos >= this.start; --pos) {
      const blockHash = await this.client.blockHash(pos)
      if (blockHash instanceof ClientError) return blockHash
      if (blockHash === null) return new ClientError("No block hash found")

      const blockRef: BlockRef = { hash: blockHash, height: pos }
      const extrinsic = await new Block(this.client, blockRef.hash).rxt.last(opts)
      if (extrinsic instanceof ClientError) return extrinsic
      if (extrinsic === null) continue

      return { ref: blockRef, extrinsic }
    }

    return null
  }

  async all(opts?: BlockExtOptsExtended): Promise<BlockExtrinsicInfo[] | ClientError> {
    const result: BlockExtrinsicInfo[] = []
    for (let pos = this.start; pos < this.end; ++pos) {
      const blockHash = await this.client.blockHash(pos)
      if (blockHash instanceof ClientError) return blockHash
      if (blockHash === null) return new ClientError("No block hash found")

      const blockRef: BlockRef = { hash: blockHash, height: pos }
      const extrinsics = await new Block(this.client, blockRef.hash).rxt.all(opts)
      if (extrinsics instanceof ClientError) return extrinsics
      if (extrinsics.length == 0) continue

      result.push({ ref: blockRef, extrinsics })
    }

    return result
  }

  async count(opts?: BlockExtOptsExtended): Promise<number | ClientError> {
    opts = opts === undefined ? {} : opts
    opts.encodeAs = "None"

    const res = await this.all(opts)
    if (res instanceof ClientError) return res

    return res.length
  }

  async exists(opts?: BlockExtOptsExtended): Promise<boolean | ClientError> {
    opts = opts === undefined ? {} : opts
    opts.encodeAs = "None"

    const res = await this.first(opts)
    if (res instanceof ClientError) return res

    return res != null
  }
}
