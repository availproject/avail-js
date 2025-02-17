import { assert_eq } from "."
import { SDK, Block } from "./../src/index"

export async function runBlockDataSubmissionAll() {
  const sdk = await SDK.New(SDK.turingEndpoint)

  const block = await Block.New(sdk.client, "0x94746ba186876d7407ee618d10cb6619befc59eeb173cacb00c14d1ff492fc58")
  const blobs = block.dataSubmissions()
  assert_eq(blobs.length, 4)

  for (const blob of blobs) {
    console.log(`Tx Hash: ${blob.txHash}, Tx Index: ${blob.txIndex}, Data: ${blob.toAscii()}, App Id: ${blob.appId}, Signer: ${blob.txSigner}`)
  }
}
