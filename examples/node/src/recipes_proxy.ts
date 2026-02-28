import { BlockQueryMode, Client, Keyring, LOCAL_ENDPOINT, ONE_AVAIL } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)
  const alice = new Keyring({ type: "sr25519" }).addFromUri("//Alice")

  const call = client.tx().balances().transferAllowDeath(alice.address, ONE_AVAIL)
  const proxied = client.tx().proxy().proxy(alice.address, "Any", call)
  const outcome = await proxied.submitAndWaitForOutcome(alice, { app_id: 0 }, BlockQueryMode.Finalized)

  console.log(`proxy tx included at block=${outcome.receipt.blockHeight} idx=${outcome.receipt.extIndex}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
