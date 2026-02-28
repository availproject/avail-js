import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const sub = client.subscriptions().grandpaJustification()
  const next = await sub.next()
  const prev = await sub.prev()
  console.log(`block ${next.blockHeight} hasJustification=${next.value != null}`)
  console.log(`block ${prev.blockHeight} hasJustification=${prev.value != null}`)

  const historical = client.subscriptions().grandpaJustification()
  historical.withStartHeight(2000384)
  const at = await historical.next()
  console.log(`block ${at.blockHeight} hasJustification=${at.value != null}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
