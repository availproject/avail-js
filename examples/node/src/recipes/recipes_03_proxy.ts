import { Client, LOCAL_ENDPOINT, Keyring } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const proxy = new Keyring({ type: 'sr25519' }).addFromUri('//Bob')
  const main = new Keyring({ type: 'sr25519' }).addFromUri('//Ferdie')

  const add = client.tx().proxy().addProxy(proxy.address, 'Any', 0)
  const addSubmitted = await add.submitSigned(main, {})
  const addReceipt = await addSubmitted.receipt()
  if (!addReceipt) throw new Error('AddProxy should be included')
  console.log(`Proxy added at block ${addReceipt.blockHeight}`)

  const call = client.tx().dataAvailability().submitData(2, 'proxy call')
  const proxied = client.tx().proxy().proxy(main.address, null, call)
  const proxiedSubmitted = await proxied.submitSigned(proxy, {})
  const proxiedReceipt = await proxiedSubmitted.receipt()
  if (!proxiedReceipt) throw new Error('Proxy call should be included')

  const remove = client.tx().proxy().removeProxy(proxy.address, 'Any', 0)
  const removeSubmitted = await remove.submitSigned(main, {})
  const removeReceipt = await removeSubmitted.receipt()
  if (!removeReceipt) throw new Error('RemoveProxy should be included')

  console.log(`Proxy call included at block ${proxiedReceipt.blockHeight}`)
  console.log(`Proxy removed at block ${removeReceipt.blockHeight}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
