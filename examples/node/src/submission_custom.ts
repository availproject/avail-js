import { BlockQueryMode, Client, Keyring, ONE_AVAIL, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const signer = new Keyring({ type: "sr25519" }).addFromUri("//Bob")

  const call = client.tx().balances().transferAllowDeath(signer.address, ONE_AVAIL)
  const outcome = await call.submitAndWaitForOutcome(signer, { app_id: 0 }, BlockQueryMode.Finalized)

  console.log(`custom tx included at block=${outcome.receipt.blockHeight} idx=${outcome.receipt.extIndex}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
