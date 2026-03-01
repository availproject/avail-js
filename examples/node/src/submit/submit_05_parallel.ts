import { Client, LOCAL_ENDPOINT, Keyring } from 'avail-js-sdk'

async function submitOne(uri: string) {
  const client = await Client.connect(LOCAL_ENDPOINT)
  const signer = new Keyring({ type: 'sr25519' }).addFromUri(uri)

  const tx = client.tx().dataAvailability().submitData(2, `parallel:${uri}`)
  const submitted = await tx.submitSigned(signer, {})
  const receipt = await submitted.waitForFinalized()

  console.log(`Included ${uri}: ${receipt.blockHeight}`)
}

async function main() {
  await Promise.all([submitOne('//Alice'), submitOne('//Bob'), submitOne('//Charlie')])
  console.log('All transactions submitted and included')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
