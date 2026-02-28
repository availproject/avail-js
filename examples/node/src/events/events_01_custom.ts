import { Client, TURING_ENDPOINT } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const block = client.block(2_042_845)
  const phase = await block.events().extrinsic(1)
  if (!phase) throw new Error('Expected events for extrinsic 1')

  console.log(`Phase=${phase.phase}, events=${phase.events.length}`)
  for (const event of phase.events) {
    console.log(`pallet=${event.palletId}, variant=${event.variantId}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
