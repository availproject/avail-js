import type { BlockPhaseEvent, Options as BlockEventsOptions } from "../core/rpc/system/fetch_events"
import type { ExtrinsicInfo, SignerPayload } from "../core/rpc/system/fetch_extrinsics"
import { ICall } from "../core/interface"
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

export interface TypedExtrinsic<T> {
  call: T
  extHash: H256
  extIndex: number
  palletId: number
  variantId: number
  signerPayload: SignerPayload | null
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

  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<BlockPhaseEvent[]> {
    return client.chain().retryPolicy(retry, RetryPolicy.Enabled).systemFetchEvents(info.hash, this.options)
  }

  isEmpty(value: BlockPhaseEvent[]): boolean {
    return value.length === 0
  }
}

export class ExtrinsicFetcher<T> implements Fetcher<TypedExtrinsic<T>[]> {
  constructor(
    private readonly as: IHeaderAndDecodable<T>,
    private readonly options: ExtrinsicOptions,
  ) {}

  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<TypedExtrinsic<T>[]> {
    const chain = client.chain().retryPolicy(retry, RetryPolicy.Enabled)
    const rpcOptions = toRpcOptions(this.options, "Extrinsic")
    const infos = await chain.systemFetchExtrinsics(info.hash, rpcOptions)

    const typed: TypedExtrinsic<T>[] = []
    for (const infoItem of infos) {
      if (infoItem.data == null) {
        continue
      }

      const call = ICall.decode(this.as, infoItem.data, true)
      if (call instanceof Error) {
        throw call
      }

      typed.push({
        call,
        extHash: infoItem.extHash,
        extIndex: infoItem.extIndex,
        palletId: infoItem.palletId,
        variantId: infoItem.variantId,
        signerPayload: infoItem.signerPayload,
      })
    }

    return typed
  }

  isEmpty(value: TypedExtrinsic<T>[]): boolean {
    return value.length === 0
  }
}

export class EncodedExtrinsicFetcher implements Fetcher<ExtrinsicInfo[]> {
  constructor(private readonly options: ExtrinsicOptions) {}

  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<ExtrinsicInfo[]> {
    const chain = client.chain().retryPolicy(retry, RetryPolicy.Enabled)
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
