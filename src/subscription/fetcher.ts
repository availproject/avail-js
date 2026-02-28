import type { BlockPhaseEvent, Options as BlockEventsOptions } from "../core/rpc/system/fetch_events"
import type { ExtrinsicInfo } from "../core/rpc/system/fetch_extrinsics"
import type { IHeaderAndDecodable } from "../core/interface"
import type { AvailHeader } from "../core/header"
import type { SignedBlock } from "../core/polkadot"
import type { GrandpaJustification, H256, BlockInfo } from "../core/metadata"
import type { Client } from "../client/client"
import { RetryPolicy } from "../types/retry-policy"
import type { ExtrinsicOptions } from "./extrinsic-options"
import { toRpcOptions } from "./extrinsic-options"
import { Block } from "../block/block"

export interface SubscriptionItem<T> {
  value: T
  blockHeight: number
  blockHash: H256
}

export interface Fetcher<T> {
  fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<T>
  isEmpty?(value: T): boolean
}

export class BlockInfoFetcher implements Fetcher<BlockInfo> {
  async fetch(_client: Client, info: BlockInfo, _retry: RetryPolicy): Promise<BlockInfo> {
    return info
  }
}

export class BlockFetcher implements Fetcher<Block> {
  async fetch(client: Client, info: BlockInfo, _retry: RetryPolicy): Promise<Block> {
    return new Block(client, info.hash)
  }
}

export class BlockHeaderFetcher implements Fetcher<AvailHeader | null> {
  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<AvailHeader | null> {
    return client.chain().retryPolicy(retry, RetryPolicy.Enabled).blockHeader(info.hash)
  }
}

export class SignedBlockFetcher implements Fetcher<SignedBlock | null> {
  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<SignedBlock | null> {
    return client.chain().retryPolicy(retry, RetryPolicy.Inherit).signedBlock(info.hash)
  }
}

export class BlockEventsFetcher implements Fetcher<BlockPhaseEvent[]> {
  constructor(private readonly options: BlockEventsOptions) {}

  async fetch(client: Client, info: BlockInfo, _retry: RetryPolicy): Promise<BlockPhaseEvent[]> {
    return client.chain().retryPolicy(RetryPolicy.Inherit, RetryPolicy.Enabled).systemFetchEvents(info.hash, this.options)
  }

  isEmpty(value: BlockPhaseEvent[]): boolean {
    return value.length === 0
  }
}

export class ExtrinsicFetcher<T> {
  constructor(
    private readonly as: IHeaderAndDecodable<T>,
    private readonly options: ExtrinsicOptions,
  ) {}

  async fetch(client: Client, info: BlockInfo, _retry: RetryPolicy): Promise<ExtrinsicInfo[]> {
    const chain = client.chain().retryPolicy(RetryPolicy.Inherit, RetryPolicy.Enabled)
    const rpcOptions = toRpcOptions(this.options, "Extrinsic")
    return chain.systemFetchExtrinsics(info.hash, rpcOptions)
  }

  isEmpty(value: ExtrinsicInfo[]): boolean {
    return value.length === 0
  }
}

export class EncodedExtrinsicFetcher {
  constructor(private readonly options: ExtrinsicOptions) {}

  async fetch(client: Client, info: BlockInfo, _retry: RetryPolicy): Promise<ExtrinsicInfo[]> {
    const chain = client.chain().retryPolicy(RetryPolicy.Inherit, RetryPolicy.Enabled)
    const rpcOptions = toRpcOptions(this.options, "Extrinsic")
    return chain.systemFetchExtrinsics(info.hash, rpcOptions)
  }

  isEmpty(value: ExtrinsicInfo[]): boolean {
    return value.length === 0
  }
}

export class GrandpaJustificationFetcher implements Fetcher<GrandpaJustification | null> {
  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<GrandpaJustification | null> {
    return client.chain().retryPolicy(retry, RetryPolicy.Inherit).grandpaBlockJustificationJson(info.height)
  }
}
