import { Client, LOCAL_ENDPOINT, Keyring, TransactionReceipt } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const signer = new Keyring({ type: 'sr25519' }).addFromUri('//Charlie')
  const tx = client.tx().dataAvailability().submitData(2, 'manual submit')
  const signed = await tx.signOnly(signer, {})

  const extHash = await client.chain().submit(signed)
  console.log(`Submitted: ${extHash}`)

  const start = await client.finalized().blockHeight()
  const receipt = await TransactionReceipt.fromRange(client, extHash, start, start + 20)
  if (!receipt) throw new Error('Should be found')

  console.log(`Included: height=${receipt.blockHeight}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
