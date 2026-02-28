import type { IHeaderAndDecodable } from "../core/interface"
import type { Options as BlockEventsOptions } from "../core/rpc/system/fetch_events"
import type { Client } from "../client/client"
import { BlockEventsSub, BlockHeaderSub, BlockSub, SignedBlockSub } from "./block"
import { EncodedExtrinsicSub, ExtrinsicSub } from "./extrinsic"
import { GrandpaJustificationSub } from "./justification"
import type { ExtrinsicOptions } from "./extrinsic-options"
import { Sub } from "./sub"

export class SubscriptionApi {
  constructor(private readonly client: Client) {}

  sub(): Sub {
    return Sub.fromClient(this.client)
  }

  signedBlock(): SignedBlockSub {
    return SignedBlockSub.fromClient(this.client)
  }

  block(): BlockSub {
    return BlockSub.fromClient(this.client)
  }

  blockHeader(): BlockHeaderSub {
    return BlockHeaderSub.fromClient(this.client)
  }

  blockEvents(options: BlockEventsOptions): BlockEventsSub {
    return BlockEventsSub.fromClient(this.client, options)
  }

  extrinsic<T>(as: IHeaderAndDecodable<T>, options: ExtrinsicOptions): ExtrinsicSub {
    return ExtrinsicSub.fromClient(as, this.client, options)
  }

  encodedExtrinsic(options: ExtrinsicOptions): EncodedExtrinsicSub {
    return EncodedExtrinsicSub.fromClient(this.client, options)
  }

  grandpaJustification(): GrandpaJustificationSub {
    return GrandpaJustificationSub.fromClient(this.client)
  }
}
