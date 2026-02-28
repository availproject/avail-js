import { BlockQueryMode, Client, Keyring, LOCAL_ENDPOINT, ONE_AVAIL } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)
  const signer = new Keyring({ type: "sr25519" }).addFromUri("//Alice")

  const tx1 = client.tx().balances().transferKeepAlive(signer.address, ONE_AVAIL)
  const tx2 = client.tx().balances().transferKeepAlive(signer.address, ONE_AVAIL)
  const batch = client.tx().utility().batchAll([tx1, tx2])
  const outcome = await batch.submitAndWaitForOutcome(signer, { app_id: 0 }, BlockQueryMode.Finalized)

  console.log(
    `batch included at block=${outcome.receipt.blockHeight} idx=${outcome.receipt.extIndex} events=${outcome.events.length}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
