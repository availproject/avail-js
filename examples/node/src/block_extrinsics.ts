import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const block = client.block(2000000)

  const all = await block.extrinsics().all({ encodeAs: "Extrinsic" })
  const first = await block.extrinsics().get(0)

  console.log(`Extrinsics count: ${all.length}`)
  if (first != null) {
    console.log(`First ext index=${first.extIndex} hash=${first.extHash.toString()} dataLen=${first.data?.length ?? 0}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
