import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const nextAppId = await client.api().query.dataAvailability.nextAppId()
  const now = await client.api().query.timestamp.now()

  console.log(`DataAvailability::NextAppId=${nextAppId.toString()}`)
  console.log(`Timestamp::Now=${now.toString()}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
