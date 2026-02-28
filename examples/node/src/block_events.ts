import { Client, MAINNET_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(MAINNET_ENDPOINT)
  const block = client.block(2042867)

  const grouped = await block.events().all({ filter: "All", enableEncoding: true, enableDecoding: true })
  console.log(`Grouped phases: ${grouped.length}`)

  for (const phase of grouped.slice(0, 3)) {
    console.log(`phase=${phase.phase} events=${phase.events.length}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
