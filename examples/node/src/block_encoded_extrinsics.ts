import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const list = await client.block(2000000).extrinsics().all({ encodeAs: "Extrinsic" })

  for (const ext of list.slice(0, 5)) {
    console.log(`idx=${ext.extIndex} hash=${ext.extHash.toString()} encodedLen=${ext.data?.length ?? 0}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
