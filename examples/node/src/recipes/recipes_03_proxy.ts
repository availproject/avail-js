import { Client, LOCAL_ENDPOINT, Keyring } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const proxy = new Keyring({ type: 'sr25519' }).addFromUri('//Bob')
  const main = new Keyring({ type: 'sr25519' }).addFromUri('//Ferdie')

  const add = client.tx().proxy().addProxy(proxy.address, 'Any', 0)
  const addSubmitted = await add.submitSigned(main, {})
  const addReceipt = await addSubmitted.receipt()
  if (!addReceipt) throw new Error('AddProxy should be included')

  const call = client.tx().dataAvailability().submitData(2, 'proxy call')
  const proxied = client.tx().proxy().proxy(main.address, null, call)
  const proxiedSubmitted = await proxied.submitSigned(proxy, {})
  const proxiedReceipt = await proxiedSubmitted.receipt()

  console.log(`Proxy call included: ${proxiedReceipt != null}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
