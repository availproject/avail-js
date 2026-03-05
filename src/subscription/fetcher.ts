import type { PhaseEvents, AllowedEvents, AllowedExtrinsic, SignatureFilter } from "../core/rpc/custom"
import { IHeaderAndDecodable, scaleDecodeHeaderAndDecodable } from "../core/interface"
import type { AvailHeader } from "../core/header"
import type { SignedBlock } from "../core/polkadot"
import type { GrandpaJustification, H256, BlockInfo } from "../core/types"
import type { Client } from "../client/client"
import { RetryPolicy } from "../types"
import { Block } from "../block/block"
import { TypedExtrinsic, UntypedExtrinsic } from "../block/extrinsics"

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
    return client.chain().retryPolicy(retry, "enabled").blockHeader(info.hash)
  }
}

export class SignedBlockFetcher implements Fetcher<SignedBlock | null> {
  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<SignedBlock | null> {
    return client.chain().retryPolicy(retry, "inherit").legacyBlock(info.hash)
  }
}

export class BlockEventsFetcher implements Fetcher<PhaseEvents[]> {
  constructor(
    private readonly allowList: AllowedEvents,
    private readonly fetchData: boolean,
  ) {}

  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<PhaseEvents[]> {
    return client.chain().retryPolicy(retry, "enabled").events(info.hash, this.allowList, this.fetchData)
  }

  isEmpty(value: PhaseEvents[]): boolean {
    return value.length === 0
  }
}

export class ExtrinsicFetcher<T> implements Fetcher<TypedExtrinsic<T>[]> {
  constructor(
    private readonly as: IHeaderAndDecodable<T>,
    private readonly signatureFilter?: SignatureFilter,
  ) {}

  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<TypedExtrinsic<T>[]> {
    const chain = client.chain().retryPolicy(retry, "enabled")
    const allowList: AllowedExtrinsic[] = [{ PalletCall: [this.as.palletId(), this.as.variantId()] }]
    const exts = await chain.extrinsics(info.hash, allowList, this.signatureFilter ?? {}, "Extrinsic")

    return exts.map((value) => TypedExtrinsic.fromRpcExtrinsic(this.as, value, info.hash))
  }

  isEmpty(value: TypedExtrinsic<T>[]): boolean {
    return value.length === 0
  }
}

export class UntypedExtrinsicFetcher implements Fetcher<UntypedExtrinsic[]> {
  constructor(
    private readonly allowList?: AllowedExtrinsic[],
    private readonly signatureFilter?: SignatureFilter,
  ) {}

  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<UntypedExtrinsic[]> {
    const chain = client.chain().retryPolicy(retry, "enabled")
    const exts = await chain.extrinsics(info.hash, this.allowList ?? null, this.signatureFilter ?? {}, "Extrinsic")

    return exts.map((value) => UntypedExtrinsic.fromRpcExtrinsic(value, info.hash))
  }

  isEmpty(value: UntypedExtrinsic[]): boolean {
    return value.length === 0
  }
}

export class GrandpaJustificationFetcher implements Fetcher<GrandpaJustification | null> {
  async fetch(client: Client, info: BlockInfo, retry: RetryPolicy): Promise<GrandpaJustification | null> {
    return client.chain().retryPolicy(retry, "inherit").blockJustification(info.height)
  }
}
