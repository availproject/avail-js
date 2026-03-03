import type { AccountData, AccountId, AccountInfo, BlockInfo } from "../core/metadata"
import type { SignedBlock } from "../core/polkadot"
import type { AvailHeader } from "../core/header"
import type { Block } from "../block/block"
import { NotFoundError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { AccountLike, BlockQueryMode, RetryPolicy } from "../types"
import type { Client } from "../client/client"

export class Head {
  private policy: RetryPolicy = "inherit"

  constructor(
    private readonly client: Client,
    private readonly mode: BlockQueryMode,
  ) {}

  retryPolicy(policy: RetryPolicy): Head {
    this.policy = policy
    return this
  }

  private chain() {
    return this.client.chain().retryPolicy(this.policy, "enabled")
  }

  async blockInfo(): Promise<BlockInfo> {
    const chainInfo = await this.chain().info()
    if (this.mode == "best") {
      return { hash: chainInfo.bestHash, height: chainInfo.bestHeight }
    }

    return { hash: chainInfo.finalizedHash, height: chainInfo.finalizedHeight }
  }

  async blockHash() {
    const info = await this.blockInfo()
    return info.hash
  }

  async blockHeight() {
    const info = await this.blockInfo()
    return info.height
  }

  async blockHeader(): Promise<AvailHeader> {
    const hash = await this.blockHash()
    const header = await this.chain().blockHeader(hash)
    if (header == null) {
      throw new NotFoundError("Failed to fetch head block header", {
        operation: ErrorOperation.HeadBlockHeader,
        details: { head: this.mode, blockHash: hash.toString() },
      })
    }
    return header
  }

  async block(): Promise<Block> {
    return this.client.block(await this.blockHash())
  }

  async blockTimestamp(): Promise<number> {
    return this.chain().blockTimestamp(await this.blockHash())
  }

  async signedBlock(): Promise<SignedBlock> {
    const hash = await this.blockHash()
    const block = await this.chain().legacyBlock(hash)
    if (block == null) {
      throw new NotFoundError("Failed to fetch head signed block", {
        operation: ErrorOperation.HeadSignedBlock,
        details: { head: this.mode, blockHash: hash.toString() },
      })
    }
    return block
  }

  async legacyBlock(): Promise<SignedBlock> {
    return this.signedBlock()
  }

  async accountNonce(accountId: AccountLike): Promise<number> {
    return (await this.accountInfo(accountId)).nonce
  }

  async accountBalance(accountId: AccountLike): Promise<AccountData> {
    return (await this.accountInfo(accountId)).data
  }

  async accountInfo(accountId: AccountLike): Promise<AccountInfo> {
    return this.chain().accountInfo(accountId, await this.blockHash())
  }

  shouldRetryOnError(): boolean {
    return this.chain().shouldRetryOnError()
  }
}
