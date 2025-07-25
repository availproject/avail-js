import { Client } from "./main_client"
import { AvailHeader, Core, SignedBlock, log } from "./../index"
import { fetchExtrinsicV1Types, fetchExtrinsicV1, fetchEventsV1, fetchEventsV1Types } from "./../../core/rpc/system"
import { sleepSeconds } from "./../utils"

export class RpcApi {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  public async chainGetHeader(blockHash?: string): Promise<AvailHeader | null> {
    const header = await Core.rpc.chain.getHeader(this.client.endpoint, blockHash)
    if (header == null) {
      return null
    }
    const h = this.client.api.registry.createType("Header", header) as AvailHeader
    return h
  }

  public async chainGetBlock(blockHash?: string): Promise<SignedBlock | null> {
    const block = await Core.rpc.chain.getBlock(this.client.endpoint, blockHash)
    if (block == null) {
      return null
    }

    const b = this.client.api.registry.createType("SignedBlock", block) as SignedBlock
    return b
  }

  public async systemFetchExtrinsicV1(
    blockId: Core.HashNumber,
    transactionFilter?: fetchExtrinsicV1Types.TransactionFilterOptions | null,
    signatureFilter?: fetchExtrinsicV1Types.SignatureFilterOptions | null,
    encodeAs?: fetchExtrinsicV1Types.EncodeSelector | null,
  ): Promise<fetchExtrinsicV1Types.ExtrinsicInformation[]> {
    const options: fetchExtrinsicV1Types.Options = {
      filter: {
        transaction: transactionFilter,
        signature: signatureFilter,
      },
      encode_selector: encodeAs,
    }
    const res = await fetchExtrinsicV1(this.client.endpoint, blockId, options)

    if (res.result != null) {
      return res.result
    }

    if (res.error != null) {
      throw Error(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
    }

    throw Error(`Something went wrong with systemFetchExtrinsicV1`)
  }

  public async systemFetchExtrinsicV1WithRetries(
    blockId: Core.HashNumber,
    transactionFilter?: fetchExtrinsicV1Types.TransactionFilterOptions | null,
    signatureFilter?: fetchExtrinsicV1Types.SignatureFilterOptions | null,
    encodeAs?: fetchExtrinsicV1Types.EncodeSelector | null,
  ): Promise<fetchExtrinsicV1Types.ExtrinsicInformation[]> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      try {
        const info = await this.systemFetchExtrinsicV1(blockId, transactionFilter, signatureFilter, encodeAs)
        return info
      } catch (e: any) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          throw e
        }

        log.warn(`Calling rpc systemFetchExtrinsic ended with err ${e}. Sleep for ${duration} seconds`)
        await sleepSeconds(duration)
        continue
      }
    }
  }

  public async systemFetchEventsV1(
    blockHash: Core.H256 | string,
    filter?: fetchEventsV1Types.Filter | null,
    enableEncoding?: boolean | null,
    enableDecoding?: boolean | null,
  ): Promise<fetchEventsV1Types.GroupedRuntimeEvents[]> {
    const options: fetchEventsV1Types.Options = {
      filter,
      enable_encoding: enableEncoding,
      enable_decoding: enableDecoding,
    }
    const res = await fetchEventsV1(this.client.endpoint, blockHash, options)

    if (res.result != null) {
      return res.result
    }

    if (res.error != null) {
      throw Error(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
    }

    throw Error(`Something went wrong with systemFetchEventsV1`)
  }

  public async systemFetchEventsV1WithRetries(
    blockHash: Core.H256 | string,
    filter?: fetchEventsV1Types.Filter | null,
    enableEncoding?: boolean | null,
    enableDecoding?: boolean | null,
  ): Promise<fetchEventsV1Types.GroupedRuntimeEvents[]> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      try {
        const info = await this.systemFetchEventsV1(blockHash, filter, enableEncoding, enableDecoding)
        return info
      } catch (e: any) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          throw e
        }

        log.warn(`Calling rpc systemFetchEvents ended with err ${e}. Sleep for ${duration} seconds`)
        await sleepSeconds(duration)
        continue
      }
    }
  }
}
