import type { ExtrinsicInfo, TransactionSignature, PhaseEvents, AllowedEvents } from "../core/rpc/custom"
import { ICall } from "../core/interface"
import type { IHeaderAndDecodable } from "../core/interface"
import type { AvailHeader } from "../core/header"
import type { SignedBlock } from "../core/polkadot"
import type { GrandpaJustification, H256, BlockInfo } from "../core/metadata"
import type { Client } from "../client/client"
import { RetryPolicy } from "../types"
import type { ExtrinsicOptions } from "./extrinsic-options"
import { toAllowList, toSignatureFilter } from "./extrinsic-options"
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
  signature: TransactionSignature | null
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
    return client.chain().retryPolicy(retry, RetryPolicy.Inherit).legacyBlock(info.hash)
  }
}

export class BlockEventsFetcher implements Fetcher<PhaseEvents[]> {
  constructor(
    private readonly allowList: AllowedEvents,
    private readonly fetchData: boolean,
  ) {}

  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<PhaseEvents[]> {
    return client.chain().retryPolicy(retry, RetryPolicy.Enabled).events(info.hash, this.allowList, this.fetchData)
  }

  isEmpty(value: PhaseEvents[]): boolean {
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
    const allowList = toAllowList(this.options.filter)
    const sigFilter = toSignatureFilter(this.options)
    const infos = await chain.extrinsics(info.hash, allowList, sigFilter, "Extrinsic")

    const typed: TypedExtrinsic<T>[] = []
    for (const infoItem of infos) {
      if (infoItem.data === "") {
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
        signature: infoItem.signature,
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
    const allowList = toAllowList(this.options.filter)
    const sigFilter = toSignatureFilter(this.options)
    return chain.extrinsics(info.hash, allowList, sigFilter, "Extrinsic")
  }

  isEmpty(value: ExtrinsicInfo[]): boolean {
    return value.length === 0
  }
}

export class GrandpaJustificationFetcher implements Fetcher<GrandpaJustification | null> {
  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<GrandpaJustification | null> {
    return client.chain().retryPolicy(retry, RetryPolicy.Inherit).blockJustification(info.height)
  }
}
