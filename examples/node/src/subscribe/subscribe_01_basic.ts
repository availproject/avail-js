import { Client, TURING_ENDPOINT } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  // Subscribe to finalized blocks
  const cursor = await client.subscribe().blocks().buildCursor()
  const block = await cursor.next()

  console.log(`Height: ${block.blockHeight}, Hash: ${block.blockHash}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
