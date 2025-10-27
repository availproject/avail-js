import type { Client } from "../client"
import { avail } from "../core"
import type { AccountId, BlockInfo, GrandpaJustification, PerDispatchClassWeight, Weight } from "../core/metadata"
import { H256 } from "../core/metadata"
import { AvailError } from "../core/misc/error"
import type { AvailHeader } from "../core/misc/header"
import type { BN } from "../core/misc/polkadot"
import type { Options as FetchExtrinsicOptions, ExtrinsicInfo } from "../core/rpc/system/fetch_extrinsics"
import { BlockEncodedExtrinsicsQuery } from "./encoded"
import { BlockEventsQuery } from "./events"
import { BlockExtrinsicsQuery } from "./extrinsic"
import { BlockContext } from "./shared"

export class Block {
  private ctx: BlockContext

  constructor(client: Client, blockId: H256 | string | number) {
    this.ctx = new BlockContext(client, blockId)
  }

  encoded(): BlockEncodedExtrinsicsQuery {
    return new BlockEncodedExtrinsicsQuery(this.ctx.client, this.ctx.blockId)
  }

  extrinsics(): BlockExtrinsicsQuery {
    return new BlockExtrinsicsQuery(this.ctx.client, this.ctx.blockId)
  }

  async extrinsicInfos(options?: FetchExtrinsicOptions): Promise<AvailError | ExtrinsicInfo[]> {
    const chain = this.ctx.chain()
    return await chain.systemFetchExtrinsics(this.ctx.blockId, options)
  }

  events(): BlockEventsQuery {
    return new BlockEventsQuery(this.ctx.client, this.ctx.blockId)
  }

  setRetryOnError(value: boolean | null) {
    this.ctx.setRetryOnError(value)
  }

  shouldRetryOnError(): boolean {
    return this.ctx.shouldRetryOnError()
  }

  async justification(): Promise<GrandpaJustification | null | AvailError> {
    const blockId = this.ctx.hashNumber()
    if (blockId instanceof AvailError) return blockId

    const chain = this.ctx.chain()
    let blockHeight: number = 0
    if (blockId instanceof H256) {
      const height = await chain.blockHeight(blockId)
      if (height instanceof AvailError) return height
      if (height == null) return new AvailError("Failed to find block from the provided hash")
      blockHeight = height
    } else {
      blockHeight = blockId
    }

    return await chain.grandpaBlockJustificationJson(blockHeight)
  }

  async timestamp(): Promise<AvailError | BN> {
    const query = this.extrinsics()
    const timestamp = await query.first(avail.timestamp.tx.Set)
    if (timestamp instanceof AvailError) return timestamp
    if (timestamp == null) return new AvailError("No timestamp transaction found in block")

    return timestamp.call.now
  }

  async info(): Promise<AvailError | BlockInfo> {
    const chain = this.ctx.chain()
    return await chain.blockInfoFrom(this.ctx.blockId)
  }

  async header(): Promise<AvailError | AvailHeader> {
    return await this.ctx.header()
  }

  async author(): Promise<AvailError | AccountId> {
    const chain = this.ctx.chain()
    return await chain.blockAuthor(this.ctx.blockId)
  }

  async extrinsicCount(): Promise<AvailError | number> {
    const encoded = this.encoded()
    encoded.setRetryOnError(this.shouldRetryOnError())
    return await encoded.count()
  }

  async eventCount(): Promise<AvailError | number> {
    return await this.ctx.eventCount()
  }

  async weight(): Promise<PerDispatchClassWeight | AvailError> {
    const chain = this.ctx.chain()
    return await chain.blockWeight(this.ctx.blockId)
  }

  async extrinsicWight(): Promise<Weight | AvailError> {
    return await this.events().extrinsicWeight()
  }
}
