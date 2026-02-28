import { Client, TURING_ENDPOINT } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  // raw() - Just block height and hash
  const rawCursor = await client.subscribe().raw().buildCursor()
  const info = await rawCursor.next()
  console.log(`raw: height=${info.value.height}, hash=${info.value.hash}`)

  // blocks() - Full block with extrinsics
  const blockCursor = await client.subscribe().blocks().buildCursor()
  const block = await blockCursor.next()
  console.log(`blocks: height=${block.blockHeight}`)

  // blockHeaders() - Block header only
  const headerCursor = await client.subscribe().blockHeaders().buildCursor()
  const header = await headerCursor.next()
  console.log(`blockHeaders: height=${header.value?.number}`)

  // signedBlocks() - Full block with justification
  const signedCursor = await client.subscribe().signedBlocks().buildCursor()
  const signed = await signedCursor.next()
  console.log(`signedBlocks: height=${signed.blockHeight}`)

  // blockEvents() - Events within a block
  const sub = await client
    .subscribe()
    .blockEvents({ filter: { Only: [0] } })
    .skipEmpty()
    .build()
  const events = await sub.next()
  console.log(`blockEvents: height=${events.blockHeight}, count=${events.value.length}`)

  // grandpaJustifications() - Grandpa justifications
  const justCursor = await client.subscribe().grandpaJustifications().buildCursor()
  const just = await justCursor.next()
  console.log(`grandpaJustifications: height=${just.blockHeight}, present=${just.value != null}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
