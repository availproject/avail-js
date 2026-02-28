import { BlockQueryMode, Client, Keyring, LOCAL_ENDPOINT, ONE_AVAIL } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)
  const keyring = new Keyring({ type: "sr25519" })
  const alice = keyring.addFromUri("//Alice")
  const bob = keyring.addFromUri("//Bob")

  const call = client.tx().balances().transferAllowDeath(alice.address, ONE_AVAIL)
  const asMulti = client.tx().multisig().asMultiThreshold1([bob.address], call)
  const outcome = await asMulti.submitAndWaitForOutcome(alice, { app_id: 0 }, BlockQueryMode.Finalized)

  console.log(`multisig tx included at block=${outcome.receipt.blockHeight} idx=${outcome.receipt.extIndex}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
