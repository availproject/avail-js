import { assert_eq } from "."
import { SDK, Block } from "./../src/index"

export async function runBlockDataSubmissionByHash() {
  const sdk = await SDK.New(SDK.turingEndpoint)

  const txHash = "0xe7efa71363d11bce370fe71a33e5ff296775f37507075c49316132131420f793"
  const block = await Block.New(sdk.client, "0x94746ba186876d7407ee618d10cb6619befc59eeb173cacb00c14d1ff492fc58")
  const blobs = block.dataSubmissions({ txHash: txHash })
  assert_eq(blobs.length, 1)

  for (const blob of blobs) {
    assert_eq(blob.txHash.toString(), txHash)
    console.log(`Tx Hash: ${blob.txHash}, Tx Index: ${blob.txIndex}, Data: ${blob.toAscii()}, App Id: ${blob.appId}, Signer: ${blob.txSigner}`)
  }

  console.log("runBlockDataSubmissionByHash finished correctly")
}
