import { ApiPromise } from "@polkadot/api";
import { initialize } from "../../chain";
import { Extrinsic, Index, RuntimeVersion } from "@polkadot/types/interfaces"
import { H256, AccountId, AccountInfo, SignedBlock, Header, } from "./../../core/index"
import { BlockClient } from "./block_client";
import { RpcClient } from "./rpc_client";
import { Core } from "./../index"

export class Client {
  public api: ApiPromise
  public endpoint: string
  private constructor(api: ApiPromise, endpoint: string) { this.api = api; this.endpoint = endpoint }

  // New Instance
  public static async create(endpoint: string, useHttpProvider?: boolean): Promise<Client> {
    const api = await initialize(endpoint, undefined, useHttpProvider)
    return new Client(api, endpoint)
  }

  // Genesis Hash and Runtime Version
  public genesisHash(): H256 {
    return new H256(this.api.genesisHash)
  }

  public runtimeVersion(): RuntimeVersion {
    return this.api.runtimeVersion
  }

  // Block Header
  public async blockHeader(blockHash: H256 | string): Promise<Header> {
    return await this.api.rpc.chain.getHeader(blockHash.toString())
  }

  public async bestBlockHeader(): Promise<Header> {
    return await this.api.rpc.chain.getHeader()
  }

  public async finalizedBlockHeader(): Promise<Header> {
    return await this.api.rpc.chain.getHeader((await this.finalizedBlockHash()).value)
  }

  // Block Hash
  public async blockHash(blockHeight: number): Promise<H256 | null> {
    const hash = await this.api.rpc.chain.getBlockHash(blockHeight)
    const h256 = new H256(hash)
    if (h256 == H256.default()) {
      return null
    }

    return h256
  }

  public async bestBlockHash(): Promise<H256> {
    return new H256(await this.api.rpc.chain.getBlockHash())
  }

  public async finalizedBlockHash(): Promise<H256> {
    return new H256(await this.api.rpc.chain.getFinalizedHead())
  }

  // Block Height
  public async blockHeight(blockHash: H256 | string): Promise<number> {
    return (await this.blockHeader(blockHash)).number.toNumber()
  }

  public async bestBlockHeight(): Promise<number> {
    return (await this.bestBlockHeader()).number.toNumber()
  }

  public async finalizedBlockHeight(): Promise<number> {
    return (await this.finalizedBlockHeader()).number.toNumber()
  }

  // Nonce
  public async nonce(accountId: AccountId | string): Promise<number> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    const r = await this.api.rpc.system.accountNextIndex<Index>(address)
    return r.toNumber()
  }

  public async blockNonce(accountId: AccountId | string, blockHash: H256 | string): Promise<number> {
    const accountInfo = this.accountInfo(accountId, blockHash)
    return (await accountInfo).nonce.toNumber()
  }

  public async bestBlockBlockNonce(accountId: AccountId | string): Promise<number> {
    const accountInfo = this.bestBlockAccountInfo(accountId)
    return (await accountInfo).nonce.toNumber()
  }

  public async finalizedBlockBlockNonce(accountId: AccountId | string): Promise<number> {
    const accountInfo = this.finalizedBlockAccountInfo(accountId)
    return (await accountInfo).nonce.toNumber()
  }

  // Account Info
  public async accountInfo(accountId: AccountId | string, blockHash: H256 | string): Promise<AccountInfo> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    const api = await this.api.at(blockHash.toString())
    return await api.query.system.account<AccountInfo>(address)
  }

  public async bestBlockAccountInfo(accountId: AccountId | string): Promise<AccountInfo> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    const hash = await this.bestBlockHash()
    const api = await this.api.at(hash.toString())
    return await api.query.system.account<AccountInfo>(address)
  }

  public async finalizedBlockAccountInfo(accountId: AccountId | string): Promise<AccountInfo> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
    const hash = await this.finalizedBlockHash()
    const api = await this.api.at(hash.toString())
    return await api.query.system.account<AccountInfo>(address)
  }

  // (RPC) Block
  public async block(blockHash: H256 | string): Promise<SignedBlock> {
    return await this.api.rpc.chain.getBlock(blockHash.toString())
  }

  public async best_block(): Promise<SignedBlock> {
    return await this.api.rpc.chain.getBlock()
  }

  public async finalized_block(): Promise<SignedBlock> {
    return await this.api.rpc.chain.getBlock((await this.finalizedBlockHash()).toString())
  }

  // Block State
  async blockState(blockLoc: Core.BlockLocation): Promise<Core.BlockState> {
    const realBlockHash = await this.blockHash(blockLoc.height)
    if (realBlockHash == null) {
      return "DoesNotExist"
    }

    const finalizedBlockHeight = await this.finalizedBlockHeight()
    if (blockLoc.height > finalizedBlockHeight) {
      return "Included"
    }

    if (realBlockHash.toString() != blockLoc.hash.toString()) {
      return "Discarded"
    }

    return "Finalized"
  }

  // Sign and/or Submit
  public async submit(tx: string | Extrinsic | Uint8Array): Promise<H256> {
    const hash = await this.api.rpc.author.submitExtrinsic(tx)
    return new H256(hash)
  }

  // Clients
  public blockClient(): BlockClient {
    return new BlockClient(this)
  }

  public rpc(): RpcClient {
    return new RpcClient(this)
  }
}
