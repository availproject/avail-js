import { Client, LOCAL_ENDPOINT, Keyring, ONE_AVAIL } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const alice = new Keyring({ type: 'sr25519' }).addFromUri('//Alice')
  const bob = new Keyring({ type: 'sr25519' }).addFromUri('//Bob')
  const dave = new Keyring({ type: 'sr25519' }).addFromUri('//Dave')

  const c1 = client.tx().balances().transferKeepAlive(bob.address, ONE_AVAIL)
  const c2 = client.tx().balances().transferKeepAlive(dave.address, ONE_AVAIL)

  const tx = client.tx().utility().batchAll([c1, c2])
  const submitted = await tx.submitSigned(alice, {})
  const receipt = await submitted.receipt()
  if (!receipt) throw new Error('Should be included')

  const events = await receipt.events()
  console.log(`Events: ${events.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
