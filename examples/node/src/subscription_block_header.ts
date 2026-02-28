import { BlockQueryMode, Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const finalized = client.subscriptions().blockHeader()
  const f = await finalized.next()

  const best = client.subscriptions().blockHeader()
  best.withBlockQueryMode(BlockQueryMode.Best)
  const b = await best.next()

  console.log(`finalized header number=${f?.number.toString() ?? "n/a"}`)
  console.log(`best header number=${b?.number.toString() ?? "n/a"}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
