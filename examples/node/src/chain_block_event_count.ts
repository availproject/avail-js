import { SdkError, Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  // Block Event Count
  const eventCount = await client.chain().blockEventCount(2000000)
  console.log(`Block 2000000 Event Count: ${eventCount}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Block 2000000 Event Count: 10
*/
