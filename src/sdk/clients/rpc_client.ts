import { Client, sleepOrReturnError } from "./main_client"
import { fetchExtrinsicTypes, fetchExtrinsics, fetchEvents, fetchEventsTypes } from "./../rpc/system"
import { GrandpaJustification } from "../rpc/grandpa"
import ClientError from "../error"
import { Rpc } from ".."
import { AccountId, AvailHeader, H256, SignedBlock } from "../types"
import { log } from "../log"
import { Duration, sleep } from "../utils"
import { Extrinsic, Index } from "../types/polkadot"
import { AccountInfo, HashNumber } from "../types/metadata"

export class RpcClient {
  public grandpa: Grandpa
  public author: Author
  public chain: Chain
  public system: System
  constructor(client: Client) {
    this.grandpa = new Grandpa(client)
    this.author = new Author(client)
    this.chain = new Chain(client)
    this.system = new System(client)
  }
}

class Grandpa {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  /// Cannot Throw
  async blockJustificationJson(
    blockHeight: number,
    retryOnError: boolean = true,
  ): Promise<GrandpaJustification | null | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.grandpa.blockJustificationJson(this.client.endpoint, blockHeight)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching JSON justification failed")
        if (error instanceof ClientError) return error
        continue
      }

      return result
    }
  }
}

class Author {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  /// Cannot Throw
  async submitExtrinsic(
    tx: string | Extrinsic | Uint8Array,
    retryOnError: boolean = true,
  ): Promise<H256 | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      let result: H256 | ClientError
      try {
        const hash = await this.client.api.rpc.author.submitExtrinsic(tx)
        result = new H256(hash)
      } catch (e: any) {
        result = new ClientError(e.toString())
      }

      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Submit Extrinsic failed")
        if (error instanceof ClientError) return error
        continue
      }

      return result
    }
  }
}

class Chain {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  /// Cannot Throw
  async getHeader(
    blockHash?: string,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<AvailHeader | null | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.chain.getHeader(this.client.endpoint, blockHash)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching block header failed")
        if (error instanceof ClientError) return error
        continue
      }

      if (result != null) {
        try {
          return this.client.api.registry.createType("Header", result) as AvailHeader
        } catch (e: any) {
          return new ClientError(e.toString())
        }
      }

      if (!retryOnNone || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(`Fetching block header ended with null. Sleep for ${duration} seconds`)
      await sleep(duration)
    }
  }

  /// Cannot Throw
  async getBlockHash(
    blockHeight?: number,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<H256 | null | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.chain.getBlockHash(this.client.endpoint, blockHeight)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching block hash failed")
        if (error instanceof ClientError) return error
        continue
      }

      if (result != null || !retryOnNone || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(`Fetching block hash ended with null. Sleep for ${duration} seconds`)
      await sleep(duration)
    }
  }

  async getBlock(
    blockHash?: string,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<SignedBlock | null | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await Rpc.chain.getBlock(this.client.endpoint, blockHash)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching block failed")
        if (error instanceof ClientError) return error
        continue
      }

      if (result != null) {
        try {
          return this.client.api.registry.createType("SignedBlock", result) as SignedBlock
        } catch (e: any) {
          return new ClientError(e.toString())
        }
      }

      if (!retryOnNone || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(`Fetching block ended with null. Sleep for ${duration} seconds`)
      await sleep(duration)
    }
  }
}

class System {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  /// Cannot Throw
  async getBlockNumber(
    blockHash?: H256 | string,
    retryOnError: boolean = true,
    retryOnNone: boolean = false,
  ): Promise<number | null | ClientError> {
    if (blockHash != undefined) {
      blockHash = blockHash
    } else {
      const hash = await this.client.best.blockHash(retryOnError)
      if (hash instanceof ClientError) return hash
      blockHash = hash
    }

    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))
    while (true) {
      const result = await Rpc.system.getBlockNumber(this.client.endpoint, blockHash)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching block height failed")
        if (error instanceof ClientError) return error
        continue
      }

      if (result != null || !retryOnNone || durations.length == 0) return result
      const duration = durations.pop()!
      log.warn(`Fetching block height ended with null. Sleep for ${duration} seconds`)
      await sleep(duration)
    }
  }

  /// Cannot Throw
  async accountNexIndex(accountId: AccountId | string, retryOnError: boolean = true): Promise<number | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await this.accountNexIndexInner(accountId)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching nonce failed")
        if (error instanceof ClientError) return error
        continue
      }

      return result
    }
  }

  /// Cannot Throw
  private async accountNexIndexInner(accountId: AccountId | string): Promise<number | ClientError> {
    try {
      const address = accountId instanceof AccountId ? accountId.toSS58() : accountId
      const r = await this.client.api.rpc.system.accountNextIndex<Index>(address)
      return r.toNumber()
    } catch (e: any) {
      return new ClientError(e.toString())
    }
  }

  /// Cannot Throw
  async account(
    accountId: AccountId | string,
    blockHash: H256 | string,
    retryOnError: boolean = true,
  ): Promise<AccountInfo | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await this.accountInner(accountId, blockHash)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching account failed")
        if (error instanceof ClientError) return error
        continue
      }

      return result
    }
  }

  /// Cannot Throw
  private async accountInner(
    accountId: AccountId | string,
    blockHash: H256 | string,
  ): Promise<AccountInfo | ClientError> {
    const address = accountId instanceof AccountId ? accountId.toSS58() : accountId

    try {
      const api = await this.client.api.at(blockHash.toString())
      return await api.query.system.account<AccountInfo>(address)
    } catch (e: any) {
      return new ClientError(e.toString())
    }
  }

  async fetchExtrinsic(
    blockId: HashNumber,
    options?: fetchExtrinsicTypes.Options,
    retryOnError: boolean = true,
  ): Promise<fetchExtrinsicTypes.ExtrinsicInformation[] | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await fetchExtrinsics(this.client.endpoint, blockId, options)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching extrinsics failed")
        if (error instanceof ClientError) return error
        continue
      }

      return result
    }
  }

  async fetchEvents(
    blockHash: H256 | string,
    options?: fetchEventsTypes.Options,
    retryOnError: boolean = true,
  ): Promise<fetchEventsTypes.GroupedRuntimeEvents[] | ClientError> {
    const durations = [8, 5, 3, 2, 1].map((x) => Duration.fromSecs(x))

    while (true) {
      const result = await fetchEvents(this.client.endpoint, blockHash, options)
      if (result instanceof ClientError) {
        const error = await sleepOrReturnError(durations, retryOnError, result, "Fetching events failed")
        if (error instanceof ClientError) return error
        continue
      }

      return result
    }
  }
}
