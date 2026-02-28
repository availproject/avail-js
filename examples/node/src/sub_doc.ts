import { Client, Sub, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const sub = new Sub(client)
  const finalizedHeight = await client.finalized().blockHeight()
  const next = await sub.next()
  console.log(`finalizedHeight=${finalizedHeight}, next=${next.height}`)

  sub.withStartHeight(190010)
  const at = await sub.next()
  console.log(`specific=${at.height}`)

  sub.withStartHeight(190010)
  const previous = await sub.prev()
  console.log(`previous=${previous.height}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
