import { SdkError, Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  // Block Header
  const bestBlockHeader = await client.best().blockHeader()
  const finalizedBlockHeader = await client.finalized().blockHeader()
  const blockHeader = await client.chain().blockHeader(2000000)
  if (blockHeader == null) throw "Failed to find block hash"
  console.log(`Best Block Header Data Root:              ${bestBlockHeader.extension.asV3.commitment.dataRoot}`)
  console.log(`Finalized Block Header Data Root:         ${finalizedBlockHeader.extension.asV3.commitment.dataRoot}`)
  console.log(`Block Header for block 2000000 Data Root: ${blockHeader.extension.asV3.commitment.dataRoot}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Best Block Header Data Root:              0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5
  Finalized Block Header Data Root:         0x0400b6482cbf68a604aaaed182b5b6fd68af8cb6e2c9a1f394964010f388f604
  Block Header for block 2000000 Data Root: 0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5
*/
