import { Client, LOCAL_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const best = await client.best().block()
  const finalized = await client.finalized().block()
  const custom = client.block(1)

  const bestInfo = await best.info()
  const finalizedInfo = await finalized.info()
  const customInfo = await custom.info()
  const header = await custom.header()
  const author = await custom.author()
  const nonce = await client.chain().blockNonce(author, await custom.hash())
  const weight = await custom.weight()
  const eventCount = await custom.eventCount()
  const extrinsics = await custom.extrinsics().all({ encodeAs: "Extrinsic" })

  console.log(`best=${bestInfo.height} finalized=${finalizedInfo.height} custom=${customInfo.height}`)
  console.log(`header=${header.number.toString()} author=${author.toString()} nonce=${nonce}`)
  console.log(`eventCount=${eventCount} extrinsicCount=${extrinsics.length}`)
  const totalWeight = weight.mandatory.refTime.add(weight.normal.refTime).add(weight.operational.refTime)
  console.log(`weight total=${totalWeight.toString()}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
