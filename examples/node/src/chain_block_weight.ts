import { AvailError, Client, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Block Weight
  const blockWeight = await client.chain().blockWeight(2000000)
  if (blockWeight instanceof AvailError) throw blockWeight
  console.log(`Block Mandatory Weight:   ${blockWeight.mandatory.refTime.toString()}`)
  console.log(`Block Normal Weight:      ${blockWeight.normal.refTime.toString()}`)
  console.log(`Block Operational Weight: ${blockWeight.operational.refTime.toString()}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Block Mandatory Weight:   27854773000
  Block Normal Weight:      360671400000
  Block Operational Weight: 0
*/
