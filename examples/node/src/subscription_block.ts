import { BlockQueryMode, Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const finalized = client.subscriptions().block()
  const f = await finalized.next()

  const best = client.subscriptions().block()
  best.withBlockQueryMode(BlockQueryMode.Best)
  const b = await best.next()

  console.log(`finalized: height=${f.blockHeight} hash=${f.blockHash.toString()}`)
  console.log(`best: height=${b.blockHeight} hash=${b.blockHash.toString()}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
