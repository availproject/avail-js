import { Client } from "./client/client"
import type { AccountData, AccountInfo } from "./core/metadata"
import type { AccountLike, BlockAt, BlockQueryMode } from "./types"

export class Account {
  constructor(private readonly client: Client) {}

  async info(accountId: AccountLike, mode: BlockQueryMode): Promise<AccountInfo> {
    if (mode == "finalized") {
      return await this.client.finalized().accountInfo(accountId)
    }
    return await this.client.best().accountInfo(accountId)
  }

  async infoAt(accountId: AccountLike, at: BlockAt): Promise<AccountInfo> {
    return await this.client.chain().accountInfo(accountId, at)
  }

  async nonce(accountId: AccountLike, mode: BlockQueryMode): Promise<number> {
    if (mode == "finalized") {
      return await this.client.finalized().accountNonce(accountId)
    }
    return await this.client.best().accountNonce(accountId)
  }

  async nonceAt(accountId: AccountLike, at: BlockAt): Promise<number> {
    return await this.client.chain().blockNonce(accountId, at)
  }

  async balance(accountId: AccountLike, mode: BlockQueryMode): Promise<AccountData> {
    if (mode == "finalized") {
      return await this.client.finalized().accountBalance(accountId)
    }
    return await this.client.best().accountBalance(accountId)
  }

  async balanceAt(accountId: AccountLike, at: BlockAt): Promise<AccountData> {
    return await this.client.chain().accountBalance(accountId, at)
  }
}
