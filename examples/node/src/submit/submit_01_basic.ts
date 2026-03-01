import { Client, TURING_ENDPOINT, Keyring } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const signer = new Keyring({ type: 'sr25519' }).addFromUri('//Bob')
  const tx = client.tx().dataAvailability().submitData(2, 'Hello Avail!')
  const submitted = await tx.submitSigned(signer, {})

  console.log(`Submitted: ${submitted.extHash}`)

  // Wait for transaction to be included in a finalized block
  const receipt = await submitted.waitForFinalized()

  console.log(`Included: height=${receipt.blockHeight}, hash=${receipt.blockHash}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
