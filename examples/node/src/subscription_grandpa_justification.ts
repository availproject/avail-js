import { AvailError, Client, TURING_ENDPOINT } from "avail-js"
import { GrandpaJustificationJsonSub } from "avail-js/subscription"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // By default it subscribes to finalized block
  const sub1 = new GrandpaJustificationJsonSub(client);
  const nextJust1 = await sub1.next()
  const prevJust1 = await sub1.prev()
  if (nextJust1 instanceof AvailError) throw nextJust1
  if (prevJust1 instanceof AvailError) throw prevJust1
  console.log(`Block ${nextJust1.blockHeight} has grandpa justifications: ${nextJust1.value != null}`)
  console.log(`Block ${prevJust1.blockHeight} has grandpa justifications: ${prevJust1.value != null}`)

  // Historical Blocks
  const sub2 = new GrandpaJustificationJsonSub(client);
  sub2.setBlockHeight(2000384)
  const nextJust2 = await sub2.next()
  if (nextJust2 instanceof AvailError) throw nextJust2
  console.log(`Block ${nextJust2.blockHeight} has grandpa justifications: ${nextJust2.value != null}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Block 2530539 has grandpa justifications: false
  Block 2530538 has grandpa justifications: false
  Block 2000384 has grandpa justifications: true

*/
