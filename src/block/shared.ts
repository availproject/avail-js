import { Chain } from "../chain/chain"
import { Client } from "../client"
import { H256 } from "../core/metadata"
import { AvailError } from "../core/misc/error"
import { ExtrinsicInfo } from "../core/rpc/system/fetch_extrinsics"

export class BlockContext {
  public client: Client
  public blockId: H256 | string | number
  private retryOnError: boolean | null = null

  constructor(client: Client, blockId: H256 | string | number) {
    this.client = client
    this.blockId = blockId
  }

  setRetryOnError(value: boolean | null) {
    this.retryOnError = value
  }

  shouldRetryOnError(): boolean {
    return this.retryOnError ?? this.client.isGlobalRetiresEnabled()
  }

  hashNumber(): AvailError | H256 | number {
    if (this.blockId instanceof H256) {
      return this.blockId
    }

    if (typeof this.blockId === "number") {
      return this.blockId
    }

    return H256.from(this.blockId)
  }

  chain(): Chain {
    return this.client.chain().retryOn(this.retryOnError, null)
  }
}

export class BlockExtrinsicMetadata {
  constructor(
    public readonly extHash: H256,
    public readonly extIndex: number,
    public readonly palletId: number,
    public readonly variantId: number,
    public readonly blockId: H256 | number,
  ) {}

  static fromExtrinsicInfo(info: ExtrinsicInfo, blockId: H256 | number): BlockExtrinsicMetadata {
    return new BlockExtrinsicMetadata(info.extHash, info.extIndex, info.palletId, info.variantId, blockId)
  }
}
