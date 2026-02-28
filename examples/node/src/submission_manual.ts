import { BlockQueryMode, Client, Keyring, LOCAL_ENDPOINT, TransactionReceipt } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)
  const signer = new Keyring({ type: "sr25519" }).addFromUri("//Charlie")

  const tx = client.tx().dataAvailability().submitData("manual submission")
  const signed = await tx.sign(signer, { app_id: 0 })
  const extHash = await client.chain().submit(signed)
  const finalized = await client.finalized().blockHeight()

  const receipt = await TransactionReceipt.fromRange(client, extHash, finalized, finalized + 10, {
    mode: BlockQueryMode.Finalized,
  })

  console.log(`extHash=${extHash.toString()}`)
  console.log(`receiptFound=${receipt != null}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
