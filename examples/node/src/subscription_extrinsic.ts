import { BlockQueryMode, Client, TURING_ENDPOINT, avail } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const finalized = client.subscriptions().extrinsic(avail.dataAvailability.tx.SubmitData, {
    filter: { PalletCall: [[29, 1]] },
  })
  const e1 = await finalized.next()
  console.log(`finalized height=${e1.blockHeight} count=${e1.list.length}`)

  const best = client.subscriptions().extrinsic(avail.dataAvailability.tx.SubmitData, {
    filter: { PalletCall: [[29, 1]] },
  })
  best.withBlockQueryMode(BlockQueryMode.Best)
  const e2 = await best.next()
  console.log(`best height=${e2.blockHeight} count=${e2.list.length}`)

  const historical = client.subscriptions().extrinsic(avail.dataAvailability.tx.SubmitData, {
    filter: { PalletCall: [[29, 1]] },
  })
  historical.withStartHeight(2000000)
  const e3 = await historical.next()
  console.log(`historical height=${e3.blockHeight} count=${e3.list.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
