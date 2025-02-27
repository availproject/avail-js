import { assert_eq } from "."
import { SDK, Block } from "./../src/index"

export async function runBlockDataSubmissionByAppId() {
  const sdk = await SDK.New(SDK.turingEndpoint)

  const appId = 2
  const block = await Block.New(sdk.client, "0x94746ba186876d7407ee618d10cb6619befc59eeb173cacb00c14d1ff492fc58")
  const blobs = block.dataSubmissions({ appId: appId })
  assert_eq(blobs.length, 2)

  for (const blob of blobs) {
    assert_eq(blob.appId, appId)
    console.log(
      `Tx Hash: ${blob.txHash}, Tx Index: ${blob.txIndex}, Data: ${blob.toAscii()}, App Id: ${blob.appId}, Signer: ${blob.txSigner}`,
    )
  }

  console.log("runBlockDataSubmissionByAppId finished correctly")
}
