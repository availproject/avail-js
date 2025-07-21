import { Client } from "./main_client";
import { HashNumber } from "./../index"
import { fetchExtrinsicV1Types, fetchExtrinsicV1 } from "./../../core/rpc/system"

export class RpcClient {
  private client: Client
  constructor(client: Client) { this.client = client }

  public async systemFetchExtrinsicV1(blockId: HashNumber, transactionFilter: fetchExtrinsicV1Types.TransactionFilterOptions | null, signatureFilter: fetchExtrinsicV1Types.SignatureFilterOptions | null, encodeAs: fetchExtrinsicV1Types.EncodeSelector | null): Promise<fetchExtrinsicV1Types.ExtrinsicInformation[]> {
    const options: fetchExtrinsicV1Types.Options = {
      filter: {
        transaction: transactionFilter,
        signature: signatureFilter
      },
      encodeAs: encodeAs
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
}
