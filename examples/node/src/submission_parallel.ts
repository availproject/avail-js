import { BlockQueryMode, Client, Keyring, LOCAL_ENDPOINT } from "avail-js-sdk"

async function submitFor(seed: string): Promise<void> {
  const client = await Client.connect(LOCAL_ENDPOINT)
  const signer = new Keyring({ type: "sr25519" }).addFromUri(seed)

  const outcome = await client
    .tx()
    .dataAvailability()
    .submitData(`parallel submission from ${seed}`)
    .submitAndWaitForOutcome(signer, { app_id: 0 }, BlockQueryMode.Finalized)

  console.log(`${seed}: block=${outcome.receipt.blockHeight} extIndex=${outcome.receipt.extIndex}`)
}

async function main() {
  await Promise.all(["//Alice", "//Bob", "//Charlie", "//Dave"].map((seed) => submitFor(seed)))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
