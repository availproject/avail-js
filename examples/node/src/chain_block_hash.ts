import { AvailError, Client, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Block Hash
  const bestBlockHash = await client.best().blockHash()
  const finalizedBlockHash = await client.finalized().blockHash()
  const blockHash = await client.chain().blockHash(2000000)
  if (bestBlockHash instanceof AvailError) throw bestBlockHash
  if (finalizedBlockHash instanceof AvailError) throw finalizedBlockHash
  if (blockHash instanceof AvailError) throw blockHash
  if (blockHash == null) throw "Failed to find block hash"
  console.log(`Best Block Hash:              ${bestBlockHash}`)
  console.log(`Finalized Block Hash:         ${finalizedBlockHash}`)
  console.log(`Block Hash for block 2000000: ${blockHash}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Best Block Hash:              0xb220042e7337ddb4b5d8a959c41a15d0b8212d982e8f75c5b5a25b4ee1d32eab
  Finalized Block Hash:         0x19173e657e0d7b5a590b196313beb86b4830f93f7ee0ed0991ec161be9cb78b4
  Block Hash for block 2000000: 0x6831d536cc3d6408a41a1e50d66f4f48c9c2ed5ffc7cfa7505a5f0251365428f
*/
