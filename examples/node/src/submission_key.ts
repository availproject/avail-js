import { BlockQueryMode, Client, Keyring, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const signer = new Keyring({ type: "sr25519" }).addFromUri("//Bob")

  const outcome = await client
    .tx()
    .dataAvailability()
    .createApplicationKey("example-app")
    .submitAndWaitForOutcome(signer, { app_id: 0 }, BlockQueryMode.Finalized)

  console.log(`createApplicationKey included at block=${outcome.receipt.blockHeight} idx=${outcome.receipt.extIndex}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
