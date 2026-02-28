import type { AccountData, AccountId, AccountInfo } from "../core/metadata"
import type { SignedBlock } from "../core/polkadot"
import type { AvailHeader } from "../core/header"
import type { Block } from "../block/block"
import { NotFoundError } from "../errors/sdk-error"
import { ErrorOperation } from "../errors/operations"
import { RetryPolicy } from "../types/retry-policy"
import { HeadKind } from "../types/head-kind"
import type { Client } from "../client/client"

export class Head {
  private policy: RetryPolicy = RetryPolicy.Inherit

  constructor(
    private readonly client: Client,
    private readonly kind: HeadKind,
  ) {}

  retryPolicy(policy: RetryPolicy): Head {
    this.policy = policy
    return this
  }

  private chain() {
    return this.client.chain().retryPolicy(this.policy, RetryPolicy.Enabled)
  }

  async blockInfo() {
    return this.chain().blockInfo(this.kind === HeadKind.Best)
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
        details: { head: this.kind, blockHash: hash.toString() },
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
    const block = await this.chain().signedBlock(hash)
    if (block == null) {
      throw new NotFoundError("Failed to fetch head signed block", {
        operation: ErrorOperation.HeadSignedBlock,
        details: { head: this.kind, blockHash: hash.toString() },
      })
    }
    return block
  }

  async legacyBlock(): Promise<SignedBlock> {
    return this.signedBlock()
  }

  async accountNonce(accountId: AccountId | string): Promise<number> {
    return (await this.accountInfo(accountId)).nonce
  }

  async accountBalance(accountId: AccountId | string): Promise<AccountData> {
    return (await this.accountInfo(accountId)).data
  }

  async accountInfo(accountId: AccountId | string): Promise<AccountInfo> {
    return this.chain().accountInfo(accountId, await this.blockHash())
  }

  shouldRetryOnError(): boolean {
    return this.chain().shouldRetryOnError()
  }
}
