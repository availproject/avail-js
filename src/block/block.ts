import type { H256, BlockInfo, AccountId, GrandpaJustification, PerDispatchClassWeight } from "../core/types"
import type { AvailHeader } from "../core/header"
import type { SignedBlock } from "../core/polkadot"
import { NotFoundError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { BlockEvent, BlockEvents, BlockEventsQuery } from "./events"
import { BlockContext } from "./shared"
import { BlockExtrinsicsQuery, TypedExtrinsic, UntypedExtrinsic, BlockExtrinsicMetadata } from "./extrinsics"
import type { Client } from "../client/client"
import { AccountLike, BlockAt, HashLike } from "../types"

export {
  BlockEvent,
  BlockEvents,
  BlockEventsQuery,
  BlockExtrinsicsQuery,
  TypedExtrinsic,
  UntypedExtrinsic,
  BlockExtrinsicMetadata,
}

export class Block {
  private readonly ctx: BlockContext
  constructor(client: Client, at: BlockAt) {
    this.ctx = new BlockContext(client, at)
  }

  extrinsics(): BlockExtrinsicsQuery {
    return new BlockExtrinsicsQuery(this.ctx)
  }

  events(): BlockEventsQuery {
    return new BlockEventsQuery(this.ctx)
  }

  async justification(): Promise<GrandpaJustification | null> {
    return this.ctx.chain().blockJustification(this.ctx.at)
  }

  async timestamp(): Promise<number> {
    return this.ctx.chain().blockTimestamp(this.ctx.at)
  }

  async info(): Promise<BlockInfo> {
    return this.ctx.chain().blockInfoFrom(this.ctx.at)
  }

  async header(): Promise<AvailHeader> {
    const header = await this.ctx.chain().blockHeader(this.ctx.at)
    if (header == null) {
      throw new NotFoundError("Failed to fetch block header", {
        operation: ErrorOperation.BlockHeader,
        details: { at: this.ctx.at.toString() },
      })
    }
    return header
  }

  async author(): Promise<AccountId> {
    return this.ctx.chain().blockAuthor(this.ctx.at)
  }

  async nonce(accountId: AccountLike): Promise<number> {
    return this.ctx.chain().blockNonce(accountId, this.ctx.at)
  }

  async extrinsicCount(): Promise<number> {
    return this.extrinsics().count()
  }

  async eventCount(): Promise<number> {
    return this.ctx.chain().blockEventCount(this.ctx.at)
  }

  async hash(): Promise<H256> {
    return (await this.info()).hash
  }

  async height(): Promise<number> {
    return (await this.info()).height
  }

  async signed(): Promise<SignedBlock> {
    // TODO
    const block = await this.ctx.chain().legacyBlock(this.ctx.at)
    if (block == null) {
      throw new NotFoundError("Failed to fetch signed block", {
        operation: ErrorOperation.BlockSigned,
        details: { at: this.ctx.at.toString() },
      })
    }
    return block
  }

  async weight(): Promise<PerDispatchClassWeight> {
    return this.ctx.chain().blockWeight(this.ctx.at)
  }

  async metadata(): Promise<Uint8Array | null> {
    const info = await this.info()
    return this.ctx.chain().blockMetadata(info.hash)
  }
}
