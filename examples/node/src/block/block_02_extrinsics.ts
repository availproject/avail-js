import { Client, LOCAL_ENDPOINT, avail } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const block = client.block(1)
  const q = block.extrinsics()

  const raw = await q.rpcExtrinsics({ encodeAs: 'None' })
  console.log(`Total extrinsics (raw): ${raw.length}`)

  const all = await q.all()
  for (const ext of all) {
    console.log(`index=${ext.extIndex}, pallet=${ext.palletId}, call=${ext.variantId}`)
  }

  const first = await q.get(0)
  if (first) {
    console.log(`First extrinsic hash: ${first.extHash}, signed=${first.nonce() != null}`)
  }

  const timestamp = await q.firstAs(avail.timestamp.tx.Set)
  if (timestamp) {
    console.log(`Decoded timestamp set call: now=${timestamp.call.now}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
