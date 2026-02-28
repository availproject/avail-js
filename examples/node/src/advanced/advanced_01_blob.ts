import { Client, LOCAL_ENDPOINT, Keyring } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const signer = new Keyring({ type: 'sr25519' }).addFromUri('//Alice')
  const tx = client.tx().dataAvailability().submitData(2, 'blob-placeholder')
  const submitted = await tx.submitSigned(signer, {})
  const receipt = await submitted.receipt()

  console.log(`Blob-like submission included: ${receipt != null}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
