import { Client, BlockQueryMode, RetryPolicy, Keyring } from "avail-js-sdk"

async function main() {
  const client = await Client.connect("ws://127.0.0.1:9944", {
    transport: "ws",
    retryPolicy: RetryPolicy.Enabled,
  })

  const keyring = new Keyring({ type: "sr25519" })
  const alice = keyring.addFromUri("//Alice")

  const tx = client.tx().dataAvailability().submitData("v2 example")
  const outcome = await tx.submitAndWaitForOutcome(alice, { app_id: 0 }, BlockQueryMode.Finalized)

  console.log({
    blockHeight: outcome.receipt.blockHeight,
    extIndex: outcome.receipt.extIndex,
    eventCount: outcome.events.length,
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
