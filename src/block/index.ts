export * as shared from "./shared"
export * as signed from "./signed"
export * as extrinsic from "./extrinsic"
export * as extrinsicOptions from "./extrinsic_options"
export * as encoded from "./encoded"
export * as events from "./events"

import { Client } from "../client"
import { AccountId, BlockInfo, GrandpaJustification, H256 } from "../core/metadata"
import { AvailError } from "../core/misc/error"
import { AvailHeader } from "../core/misc/header"
import { BN } from "../core/misc/polkadot"
import { Options as FetchExtrinsicOptions, ExtrinsicInfo } from "../core/rpc/system/fetch_extrinsics"
import { BlockContext } from "./shared"

export class Block {
  private ctx: BlockContext

  constructor(client: Client, blockId: H256 | string | number) {
    this.ctx = new BlockContext(client, blockId)
  }

  signed(): BlockSignedExtrinsicsQuery {
    return new BlockSignedExtrinsicsQuery(this.client, this.blockId)
  }

  extrinsics(): BlockExtrinsicsQuery {
    return new BlockExtrinsicsQuery(this.client, this.blockId)
  }

  encoded(): BlockEncodedExtrinsicsQuery {
    return new BlockEncodedExtrinsicsQuery(this.client, this.blockId)
  }

  async raw_data(options?: FetchExtrinsicOptions): Promise<AvailError | ExtrinsicInfo[]> {
    const chain = this.ctx.chain()
    return await chain.systemFetchExtrinsics(this.ctx.blockId, options)
  }

  events(): BlockEventsQuery {
    return new BlockEventsQuery(this.client, this.blockId)
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

  timestamp(): AvailError | BN {
    self.encoded().timestamp().await
  }

  info(): AvailError | BlockInfo {
    let chain = self.ctx.chain()
    chain.block_info_from(self.ctx.block_id.clone()).await
  }
  header(): AvailError | AvailHeader {
    self.ctx.header().await
  }

  author(): AvailError | AccountId {
    let chain = self.ctx.chain()
    chain.block_author(self.ctx.block_id.clone()).await
  }

  extrinsic_count(): AvailError | number {
    self.encoded().extrinsic_count().await
  }

  event_count(): AvailError | number {
    let chain = self.ctx.chain()
    chain.block_event_count(self.ctx.block_id.clone()).await
  }

  // weight(& self) -> Result < PerDispatchClassWeight, Error > {
  //   let chain = self.ctx.chain();
  //   chain.block_weight(self.ctx.block_id.clone()).await
  // }

  // extrinsic_weight(& self) -> Result < Weight, Error > {
  //   self.events().extrinsic_weight().await
  // }
}
