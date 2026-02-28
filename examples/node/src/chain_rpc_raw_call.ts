import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const chain = await client.chain().rpcRawCall("system_chain")
  const version = await client.chain().rpcRawCall("system_version")

  console.log(`chain=${JSON.stringify(chain)}`)
  console.log(`version=${JSON.stringify(version)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
