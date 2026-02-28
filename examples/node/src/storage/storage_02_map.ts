import { Client, TURING_ENDPOINT, avail, StorageMap } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const endpoint = client.endpoint()

  const key = new TextEncoder().encode('my_app_key')
  const appKey = await StorageMap.fetch(avail.dataAvailability.storage.AppKeys, endpoint, key)
  if (appKey && !(appKey instanceof Error)) {
    console.log(`AppKey: ${appKey.owner}:${appKey.appId}`)
  } else {
    console.log('AppKey: none')
  }

  const hash = await client.finalized().blockHash()
  const iter = StorageMap.iter(avail.dataAvailability.storage.AppKeys, endpoint, hash)
  const first = await iter.nextKeyValue()
  if (first && !(first instanceof Error)) {
    const [k, v] = first
    console.log(`Iter first key: ${new TextDecoder().decode(k)}, owner=${v.owner}, appId=${v.appId}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
