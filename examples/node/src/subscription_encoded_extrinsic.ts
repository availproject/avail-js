import { BlockQueryMode, Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const finalized = client.subscriptions().encodedExtrinsic({ filter: { PalletCall: [[29, 1]] } })
  const f = await finalized.next()

  const best = client.subscriptions().encodedExtrinsic({ filter: { PalletCall: [[29, 1]] } })
  best.withBlockQueryMode(BlockQueryMode.Best)
  const b = await best.next()

  console.log(`finalized: height=${f.blockHeight} extrinsics=${f.list.length}`)
  console.log(`best: height=${b.blockHeight} extrinsics=${b.list.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
