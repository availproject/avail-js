import { BlockQueryMode, Client, Sub, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const finalized = new Sub(client)
  const f = await finalized.next()

  const best = new Sub(client)
  best.withBlockQueryMode(BlockQueryMode.Best)
  const b = await best.next()

  console.log(`finalized: height=${f.height} hash=${f.hash.toString()}`)
  console.log(`best: height=${b.height} hash=${b.hash.toString()}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
