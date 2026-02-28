import { Client, TURING_ENDPOINT, avail, StorageValue } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const endpoint = client.endpoint()

  const nextAppId = await StorageValue.fetch(avail.dataAvailability.storage.NextAppId, endpoint)
  console.log(`NextAppId: ${nextAppId}`)

  const now = await StorageValue.fetch(avail.timestamp.storage.Now, endpoint)
  console.log(`Timestamp::Now: ${now}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
