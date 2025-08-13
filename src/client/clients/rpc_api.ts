import { Client } from "./main_client"
import { Core, log } from "./../index"
import { fetchExtrinsicTypes, fetchExtrinsics, fetchEvents, fetchEventsTypes } from "./../../core/rpc/system"
import { OS, Duration, Extrinsic, GeneralError, H256, SignedBlock, AvailHeader } from "./../../core"

export class RpcApi {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  public async authorSubmitExtrinsic(tx: string | Extrinsic | Uint8Array): Promise<H256 | GeneralError> {
    try {
      const hash = await this.client.api.rpc.author.submitExtrinsic(tx)
      return new H256(hash)
    } catch (e: any) {
      return new GeneralError(e.toString())
    }
  }

  public async chainGetHeader(blockHash?: string): Promise<AvailHeader | null | GeneralError> {
    const header = await Core.rpc.chain.getHeader(this.client.endpoint, blockHash)
    if (header instanceof GeneralError) {
      return header
    }

    if (header == null) {
      return null
    }

    return this.client.api.registry.createType("Header", header) as AvailHeader
  }

  public async chainGetBlock(blockHash?: string): Promise<SignedBlock | null | GeneralError> {
    const block = await Core.rpc.chain.getBlock(this.client.endpoint, blockHash)
    if (block instanceof GeneralError) {
      return block
    }

    if (block == null) {
      return null
    }

    return this.client.api.registry.createType("SignedBlock", block) as SignedBlock
  }

  public async systemFetchExtrinsic(
    blockId: Core.HashNumber,
    options?: fetchExtrinsicTypes.Options,
  ): Promise<fetchExtrinsicTypes.ExtrinsicInformation[] | GeneralError> {
    const res = await fetchExtrinsics(this.client.endpoint, blockId, options)
    if (res instanceof GeneralError) {
      return res
    }

    if (res.error != null) {
      return new GeneralError(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
    }

    if (res.result != null) {
      return res.result
    }

    return new GeneralError(`Something went wrong with systemFetchExtrinsic`)
  }

  public async systemFetchExtrinsicExt(
    blockId: Core.HashNumber,
    options?: fetchExtrinsicTypes.Options,
  ): Promise<fetchExtrinsicTypes.ExtrinsicInformation[] | GeneralError> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      const result = await this.systemFetchExtrinsic(blockId, options)
      if (result instanceof GeneralError) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          return result
        }

        log.warn(`Calling rpc systemFetchExtrinsic ended with err ${result.value}. Sleep for ${duration} seconds`)
        await OS.sleep(Duration.fromSecs(duration))
        continue
      }

      return result
    }
  }

  public async systemFetchEvents(
    blockHash: Core.H256 | string,
    filter?: fetchEventsTypes.Filter | null,
    enableEncoding?: boolean | null,
    enableDecoding?: boolean | null,
  ): Promise<fetchEventsTypes.GroupedRuntimeEvents[] | GeneralError> {
    const options: fetchEventsTypes.Options = {
      filter,
      enable_encoding: enableEncoding,
      enable_decoding: enableDecoding,
    }
    const res = await fetchEvents(this.client.endpoint, blockHash, options)
    if (res instanceof GeneralError) {
      return res
    }

    if (res.error != null) {
      return new GeneralError(`Code: ${res.error.code}, Message: ${res.error.message}, Data: ${res.error.data}`)
    }

    if (res.result != null) {
      return res.result
    }

    return new GeneralError(`Something went wrong with systemFetchEventsV1`)
  }

  public async systemFetchEventsV1WithRetries(
    blockHash: Core.H256 | string,
    filter?: fetchEventsTypes.Filter | null,
    enableEncoding?: boolean | null,
    enableDecoding?: boolean | null,
  ): Promise<fetchEventsTypes.GroupedRuntimeEvents[] | GeneralError> {
    const sleepDuration = [8, 5, 3, 2, 1]

    while (true) {
      const result = await this.systemFetchEvents(blockHash, filter, enableEncoding, enableDecoding)
      if (result instanceof GeneralError) {
        const duration = sleepDuration.pop()
        if (duration == undefined) {
          return result
        }

        log.warn(`Calling rpc systemFetchEvents ended with err ${result.value}. Sleep for ${duration} seconds`)
        await OS.sleep(Duration.fromSecs(duration))
        continue
      }

      return result
    }
  }
}
