import { AvailError, Client, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Block Height
  const bestBlockHeight = await client.best().blockHeight()
  const finalizedBlockHeight = await client.finalized().blockHeight()
  const blockHeight = await client
    .chain()
    .blockHeight("0x6831d536cc3d6408a41a1e50d66f4f48c9c2ed5ffc7cfa7505a5f0251365428f")
  if (bestBlockHeight instanceof AvailError) throw bestBlockHeight
  if (finalizedBlockHeight instanceof AvailError) throw finalizedBlockHeight
  if (blockHeight instanceof AvailError) throw blockHeight
  if (blockHeight == null) throw "Failed to find block hash"
  console.log(`Best Block Height:      ${bestBlockHeight}`)
  console.log(`Finalized Block Height: ${finalizedBlockHeight}`)
  console.log(
    `Block Height for block 0x6831d536cc3d6408a41a1e50d66f4f48c9c2ed5ffc7cfa7505a5f0251365428f: ${blockHeight}`,
  )

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Best Block Height:      2505860
  Finalized Block Height: 2505859
  Block Height for block 0x6831d536cc3d6408a41a1e50d66f4f48c9c2ed5ffc7cfa7505a5f0251365428f: 2000000
*/
