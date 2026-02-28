import { BN, Client, LOCAL_ENDPOINT, Keyring, ONE_AVAIL, Weight } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const alice = new Keyring({ type: 'sr25519' }).addFromUri('//Alice')
  const bob = new Keyring({ type: 'sr25519' }).addFromUri('//Bob')
  const charlie = new Keyring({ type: 'sr25519' }).addFromUri('//Charlie')

  const call = client.tx().balances().transferKeepAlive(charlie.address, ONE_AVAIL)
  const callHash = call.callHash().toString()

  const weight = new Weight(new BN('10000000000'), new BN('0'))
  const tx = client.tx().multisig().approveAsMulti(2, [bob.address], null, callHash, weight)
  const submitted = await tx.submitSigned(alice, {})
  const receipt = await submitted.receipt()

  console.log(`Multisig approval included: ${receipt != null}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
