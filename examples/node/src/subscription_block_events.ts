import { BlockQueryMode, Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const sub = client
    .subscriptions()
    .blockEvents({ filter: "OnlyExtrinsics", enableEncoding: true, enableDecoding: true })
  const finalized = await sub.next()

  const bestSub = client
    .subscriptions()
    .blockEvents({ filter: "OnlyExtrinsics", enableEncoding: true, enableDecoding: true })
  bestSub.withBlockQueryMode(BlockQueryMode.Best)
  const best = await bestSub.next()

  console.log(`finalized: height=${finalized.blockHeight} phases=${finalized.list.length}`)
  console.log(`best: height=${best.blockHeight} phases=${best.list.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
