import { BlockQueryMode, Client, Keyring, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const signer = new Keyring({ type: "sr25519" }).addFromUri("//Bob")

  const outcome = await client
    .tx()
    .dataAvailability()
    .submitData("DA payload")
    .submitAndWaitForOutcome(signer, { app_id: 2 }, BlockQueryMode.Finalized)
  console.log(`submitted DA extrinsic at block=${outcome.receipt.blockHeight} idx=${outcome.receipt.extIndex}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
