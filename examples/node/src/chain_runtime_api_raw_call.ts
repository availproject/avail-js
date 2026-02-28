import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const head = await client.best().blockHash()
  const value = await client.chain().runtimeApiRawCall("NominationPoolsApi_pending_rewards", "0x", head)

  console.log(`runtimeApiRawCall=${value}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
