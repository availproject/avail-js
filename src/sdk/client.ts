import { ApiPromise } from "@polkadot/api";
import { QueryableStorage } from "@polkadot/api/types";
import { Header, SignedBlock } from "@polkadot/types/interfaces";
import { H256, SessionKeys } from "./metadata";

export class Client {
  public api: ApiPromise

  constructor(api: ApiPromise) {
    this.api = api
  }

  async storageAt(at?: string | H256): Promise<QueryableStorage<'promise'>> {
    if (at == undefined) {
      return this.api.query
    }

    return (await this.api.at(at.toString())).query
  }

  async headerAt(at: string | H256): Promise<Header> {
    return await this.api.rpc.chain.getHeader(at.toString())
  }

  async rpcBlockAt(at: string | H256): Promise<SignedBlock> {
    return await this.api.rpc.chain.getBlock(at.toString())
  }

  async finalizedBlockHash(): Promise<H256> {
    return new H256(await this.api.rpc.chain.getFinalizedHead())
  }

  async bestBlockHash(): Promise<H256> {
    return new H256(await this.api.rpc.chain.getBlockHash())
  }

  async blockHash(at?: number): Promise<H256> {
    return new H256(await this.api.rpc.chain.getBlockHash(at))
  }

  async finalizedBlockNumber(): Promise<number> {
    let header = await this.headerAt(await this.finalizedBlockHash())
    return header.number.toNumber()
  }

  async bestBlockNumber(): Promise<number> {
    let header = await this.headerAt(await this.bestBlockHash())
    return header.number.toNumber()
  }

  async blockNumber(at: string | H256): Promise<number> {
    let header = await this.headerAt(at)
    return header.number.toNumber()
  }

  async rotateKeys(): Promise<SessionKeys> {
    const keysBytes = await this.api.rpc.author.rotateKeys()
    return SessionKeys.fromHex(keysBytes.toString())
  }
}