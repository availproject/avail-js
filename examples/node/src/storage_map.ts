import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const appKey = await client.api().query.dataAvailability.appKeys("Hello World")
  console.log(`AppKeys(Hello World)=${appKey.toString()}`)

  const entries = await client.api().query.dataAvailability.appKeys.entries()
  console.log(`AppKeys entries sample=${entries.slice(0, 2).length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
