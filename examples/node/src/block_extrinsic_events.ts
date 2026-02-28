import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const block = client.block(2000000)
  const ext = await block.extrinsics().get(0)
  if (ext == null) {
    throw new Error("No extrinsic at index 0")
  }

  const events = await block.events().extrinsic(ext.extIndex)
  console.log(
    `Block=${await block.height()} extIndex=${ext.extIndex} phase=${events?.phase ?? "none"} events=${events?.events.length ?? 0}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
