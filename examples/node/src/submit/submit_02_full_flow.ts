import { Client, TURING_ENDPOINT, Keyring } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const signer = new Keyring({ type: 'sr25519' }).addFromUri('//Bob')
  const tx = client.tx().dataAvailability().submitData(2, 'Full flow demo')

  const fee = await tx.estimateCallFees()
  console.log(`Fee: ${fee.finalFee()}`)

  const submitted = await tx.submitSigned(signer, {})
  console.log(`Submitted: ${submitted.extHash}`)

  const receipt = await submitted.receipt()
  if (!receipt) {
    throw new Error('Should be included')
  }

  console.log(`Included: height=${receipt.blockHeight}`)

  const events = await receipt.events()
  console.log(`Events: ${events.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
