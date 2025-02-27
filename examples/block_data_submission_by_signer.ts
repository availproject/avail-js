import { assert_eq } from "."
import { SDK, Block } from "./../src/index"

export async function runBlockDataSubmissionBySigner() {
  const sdk = await SDK.New(SDK.turingEndpoint)

  const txSigner = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
  const block = await Block.New(sdk.client, "0x94746ba186876d7407ee618d10cb6619befc59eeb173cacb00c14d1ff492fc58")
  const blobs = block.dataSubmissions({ txSigner: txSigner })
  assert_eq(blobs.length, 1)

  for (const blob of blobs) {
    assert_eq(blob.txSigner, txSigner)
    console.log(
      `Tx Hash: ${blob.txHash}, Tx Index: ${blob.txIndex}, Data: ${blob.toAscii()}, App Id: ${blob.appId}, Signer: ${blob.txSigner}`,
    )
  }

  console.log("runBlockDataSubmissionBySigner finished correctly")
}
