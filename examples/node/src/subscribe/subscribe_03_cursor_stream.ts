import { Client, TURING_ENDPOINT } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  // Cursor: bidirectional iteration (next + prev)
  let cursor = await client.subscribe().blocks().buildCursor()
  let current = await cursor.next()
  console.log(`Current: ${current.blockHeight}`)

  let previous = await cursor.prev()
  console.log(`Previous: ${previous.blockHeight}`)

  // Subscription: forward-only stream (AsyncIterator)
  const sub = await client.subscribe().blocks().build()
  while (true) {
    const block = await sub.next()
    if (!block) break
    console.log(`Stream: ${block.blockHeight}`)
    break
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
