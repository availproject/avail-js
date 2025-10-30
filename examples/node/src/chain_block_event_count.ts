import { AvailError, Client, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Block Event Count
  const eventCount = await client.chain().blockEventCount(2000000)
  if (eventCount instanceof AvailError) throw eventCount
  console.log(`Block 2000000 Event Count: ${eventCount}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Block 2000000 Event Count: 10
*/
