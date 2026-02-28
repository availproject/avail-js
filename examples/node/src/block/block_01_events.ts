import { Client, TURING_ENDPOINT } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const hash = await client.chain().blockHash(2_923_704)
  if (!hash) throw new Error('Block hash not found')

  const events = await client.chain().blockEventsEncoded(hash)
  console.log(`Block 2923704 has ${events.length} events`)

  for (const [index, event] of events.entries()) {
    console.log(`${index}: pallet=${event.palletId}, variant=${event.variantId}, phase=${event.phase}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
