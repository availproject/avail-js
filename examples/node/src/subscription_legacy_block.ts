import { BlockQueryMode, Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const finalized = client.subscriptions().signedBlock()
  const n1 = await finalized.next()
  const p1 = await finalized.prev()
  console.log(`finalized next extrinsics=${n1?.block.extrinsics.length ?? 0}`)
  console.log(`finalized prev extrinsics=${p1?.block.extrinsics.length ?? 0}`)

  const best = client.subscriptions().signedBlock()
  best.withBlockQueryMode(BlockQueryMode.Best)
  const n2 = await best.next()
  console.log(`best next extrinsics=${n2?.block.extrinsics.length ?? 0}`)

  const historical = client.subscriptions().signedBlock()
  historical.withStartHeight(2000000)
  const n3 = await historical.next()
  console.log(`historical next extrinsics=${n3?.block.extrinsics.length ?? 0}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
