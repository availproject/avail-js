import { Client, TURING_ENDPOINT, Keyring, avail } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const signer = new Keyring({ type: 'sr25519' }).addFromUri('//Bob')
  const customCall = new avail.dataAvailability.tx.SubmitData(2, new TextEncoder().encode('custom tx'))
  const tx = client.txFrom(customCall)
  const submitted = await tx.submitSigned(signer, {})

  const receipt = await submitted.waitForFinalized()

  console.log(`Included: height=${receipt.blockHeight}`)

  const events = await receipt.events()
  console.log(`Events: ${events.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
