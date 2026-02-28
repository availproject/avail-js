import { BlockQueryMode, Client, Keyring, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const signer = new Keyring({ type: "sr25519" }).addFromUri("//Bob")

  const tx = client.tx().dataAvailability().submitData("My data")
  const outcome = await tx.submitAndWaitForOutcome(signer, { app_id: 2 }, BlockQueryMode.Finalized)

  const ext = await outcome.receipt.encoded()
  console.log(`block=${outcome.receipt.blockHeight} idx=${outcome.receipt.extIndex} events=${outcome.events.length}`)
  console.log(`extHash=${ext.extHash.toString()} encodedLen=${ext.data?.length ?? 0}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
