import { Client, TURING_ENDPOINT, Keyring, avail } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const signer = new Keyring({ type: 'sr25519' }).addFromUri('//Bob')
  const tx = client.tx().dataAvailability().submitData(2, 'Full flow demo')

  const fee = await tx.estimateCallFees()
  console.log(`Fee: ${fee.finalFee()}`)

  const callInfo = await tx.callInfo()
  console.log(`Weight: ${callInfo.weight.refTime}`)

  const submitted = await tx.submitSigned(signer, {})
  console.log(`Submitted: ${submitted.extHash}`)

  const receipt = await submitted.waitForFinalized()

  console.log(`Included: height=${receipt.blockHeight}`)

  const events = await receipt.events()
  console.log(`Events: ${events.length}`)

  const ext = await receipt.extrinsic(avail.dataAvailability.tx.SubmitData)
  console.log(`Decoded submitData payload bytes: ${ext.call.data.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
