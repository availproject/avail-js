import { ApiPromise } from "@polkadot/api";
import { QueryableStorage } from "@polkadot/api/types";
import { Header, SignedBlock, BlockHash, H256 } from "@polkadot/types/interfaces";

export class Client {
  public api: ApiPromise

  constructor(api: ApiPromise) {
    this.api = api
  }

  async storageAt(at: string | H256): Promise<QueryableStorage<'promise'>> {
    if (at == undefined) {
      return this.api.query
    }

    return (await this.api.at(at)).query
  }

  async headerAt(at: string | H256): Promise<Header> {
    return await this.api.rpc.chain.getHeader(at)
  }

  async rpcBlockAt(at: string | H256): Promise<SignedBlock> {
    return await this.api.rpc.chain.getBlock(at)
  }

  async finalizedBlockHash(): Promise<BlockHash> {
    return await this.api.rpc.chain.getFinalizedHead()
  }

  async bestBlockHash(): Promise<BlockHash> {
    return await this.api.rpc.chain.getBlockHash()
  }

  async blockHash(at?: number): Promise<BlockHash> {
    return await this.api.rpc.chain.getBlockHash(at)
  }

  async finalizedBlockNumber(): Promise<number> {
    let header = await this.headerAt(await this.finalizedBlockHash())
    return header.number.toNumber()
  }

  async bestBlockNumber(): Promise<number> {
    let header = await this.headerAt(await this.bestBlockHash())
    return header.number.toNumber()
  }

  async blockNumber(at: string | BlockHash): Promise<number> {
    let header = await this.headerAt(at)
    return header.number.toNumber()
  }
}