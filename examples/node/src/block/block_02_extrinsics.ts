import { Client, LOCAL_ENDPOINT } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const block = client.block(1)
  const q = block.extrinsics()

  const all = await q.all({ encodeAs: 'None' })
  console.log(`Total extrinsics: ${all.length}`)

  for (const ext of all) {
    console.log(`index=${ext.extIndex}, pallet=${ext.palletId}, call=${ext.variantId}`)
  }

  const first = await q.get(0)
  if (first) {
    console.log(`First extrinsic hash: ${first.extHash}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
