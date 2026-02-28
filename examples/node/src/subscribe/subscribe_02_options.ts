import { Client, BlockQueryMode, TURING_ENDPOINT } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  // Finalized blocks (default)
  let cursor = await client.subscribe().blocks().buildCursor()
  let block = await cursor.next()
  console.log(`Finalized: height=${block.blockHeight}`)

  // Best blocks (latest known)
  cursor = await client.subscribe().blocks().mode(BlockQueryMode.Best).buildCursor()
  block = await cursor.next()
  console.log(`Best: height=${block.blockHeight}`)

  // Historical blocks from specific height
  cursor = await client.subscribe().blocks().fromHeight(2_000_000).buildCursor()
  block = await cursor.next()
  console.log(`Historical: height=${block.blockHeight}`)

  // Skip empty blocks (useful for events/extrinsics)
  const sub = await client
    .subscribe()
    .blockEvents({ filter: { Only: [0] } })
    .skipEmpty()
    .build()
  const events = await sub.next()
  console.log(`With events: height=${events.blockHeight}, count=${events.value.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
