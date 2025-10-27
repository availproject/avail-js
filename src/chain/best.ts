import { Block } from "../block/block"
import type { Client } from "../client"
import type { AccountData, AccountId, AccountInfo, H256, BlockInfo } from "../core/metadata"
import { AvailError } from "../core/error"
import type { AvailHeader } from "../core/header"
import type { SignedBlock } from "../core/polkadot"
import { Chain } from "./chain"

/// Helper bound to the chain's best (head) block view.
export class Best {
  private client: Client
  private chain: Chain

  constructor(client: Client) {
    this.client = client
    this.chain = new Chain(client).retryOn(null, true)
  }

  /// Lets you decide if upcoming calls retry on errors
  /// Overrides whether errors are retried (defaults to the client's global flag).
  retryOn(error: boolean | null): Best {
    this.chain.retryOn(error, true)
    return this
  }

  /// Returns the hash of the best block.
  async blockHash(): Promise<H256 | AvailError> {
    const info = await this.blockInfo()
    if (info instanceof AvailError) return info
    return info.hash
  }

  /// Returns the height of the best block.
  async blockHeight(): Promise<number | AvailError> {
    const info = await this.blockInfo()
    if (info instanceof AvailError) return info
    return info.height
  }

  /// Returns the current best block header.
  async blockHeader(): Promise<AvailHeader | AvailError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    const header = await this.chain.blockHeader(blockHash)
    if (header == null) return new AvailError("Failed to fetch best block header")

    return header
  }

  /// Gives you a block handle for the best block.
  async block(): Promise<Block | AvailError> {
    const hash = await this.blockHash()
    if (hash instanceof AvailError) return hash
    return new Block(this.client, hash)
  }

  /// Returns height and hash for the best block.
  ///
  /// Equivalent to `chain().blockInfo(true)` but respecting this helper's retry setting.
  async blockInfo(): Promise<BlockInfo | AvailError> {
    return await this.chain.blockInfo(true)
  }

  /// Loads the legacy block for the best block.
  ///
  /// # Errors
  /// Returns error when the node reports no legacy block for the head.
  async legacyBlock(): Promise<SignedBlock | AvailError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    const block = await this.chain.legacyBlock(blockHash)
    if (block instanceof AvailError) return block
    if (block == null) return new AvailError("Failed to fetch latest best legacy block")

    return block
  }

  /// Returns the latest nonce for the account at the best block.
  async accountNonce(accountId: AccountId | string): Promise<number | AvailError> {
    const accountInfo = await this.accountInfo(accountId)
    if (accountInfo instanceof AvailError) return accountInfo

    return accountInfo.nonce
  }

  /// Returns the account balances at the best block.
  async accountBalance(accountId: AccountId | string): Promise<AccountData | AvailError> {
    const info = await this.accountInfo(accountId)
    if (info instanceof AvailError) return info

    return info.data
  }

  /// Returns the full account record at the best block.
  async accountInfo(accountId: AccountId | string): Promise<AccountInfo | AvailError> {
    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    return await this.chain.accountInfo(accountId, blockHash)
  }

  /// Returns true when best-block queries retry after RPC errors.
  shouldRetryOnError(): boolean {
    return this.chain.shouldRetryOnError()
  }
}
