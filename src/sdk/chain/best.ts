import { BlockApi } from "../block"
import type { Client } from "../client"
import type { AccountData, AccountId, AccountInfo, H256 } from "../core/metadata"
import type { BlockInfo } from "../core/rpc/system/other"
import { AvailError } from "../core/misc/error"
import type { AvailHeader } from "../core/misc/header"
import type { SignedBlock } from "../core/misc/polkadot"

export class Best {
  private client: Client
  private retryOnError: boolean | null = null

  constructor(client: Client) {
    this.client = client
  }

  retryOn(error: boolean | null): Best {
    this.retryOnError = error
    return this
  }

  // Block stuff
  async blockHeader(): Promise<AvailHeader | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    const header = await this.client.chain().retryOn(retryOnError, true).blockHeader(blockHash)
    if (header == null) return new AvailError("Failed to fetch best block header")

    return header
  }

  async block(): Promise<BlockApi | AvailError> {
    const hash = await this.blockHash()
    if (hash instanceof AvailError) return hash
    return new BlockApi(this.client, hash)
  }

  async blockInfo(): Promise<BlockInfo | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()
    return await this.client.chain().retryOn(retryOnError, null).blockInfo(true)
  }

  async blockHash(): Promise<H256 | AvailError> {
    const info = await this.blockInfo()
    if (info instanceof AvailError) return info
    return info.hash
  }

  async blockHeight(): Promise<number | AvailError> {
    const info = await this.blockInfo()
    if (info instanceof AvailError) return info
    return info.height
  }

  async legacyBlock(): Promise<SignedBlock | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    const block = await this.client.chain().retryOn(retryOnError, true).legacyBlock(blockHash)
    if (block instanceof AvailError) return block
    if (block == null) return new AvailError("Failed to fetch legacy block")

    return block
  }

  // Account stuff
  async accountNonce(accountId: AccountId | string): Promise<number | AvailError> {
    const accountInfo = await this.accountInfo(accountId)
    if (accountInfo instanceof AvailError) return accountInfo

    return accountInfo.nonce
  }

  async accountBalance(accountId: AccountId | string): Promise<AccountData | AvailError> {
    const info = await this.accountInfo(accountId)
    if (info instanceof AvailError) return info

    return info.data
  }

  async accountInfo(accountId: AccountId | string): Promise<AccountInfo | AvailError> {
    const retryOnError = this.retryOnError ?? this.client.isGlobalRetiresEnabled()

    const blockHash = await this.blockHash()
    if (blockHash instanceof AvailError) return blockHash

    return await this.client.chain().retryOn(retryOnError, null).accountInfo(accountId, blockHash)
  }
}
