import { Client, MAINNET_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(MAINNET_ENDPOINT)
  const block = client.block(2042867)

  const timestamp = await block.timestamp()
  const date = new Date(timestamp)
  const info = await block.info()
  const header = await block.header()
  const eventCount = await block.eventCount()
  const extrinsics = await block.extrinsics().all()
  const weight = await block.weight()

  console.log(`Timestamp: ${timestamp} (${date.toISOString()})`)
  console.log(`Block Height: ${info.height}, Block Hash: ${info.hash.toString()}`)
  console.log(`Event Count: ${eventCount}, Extrinsic Count: ${extrinsics.length}`)
  console.log(`Header Number: ${header.number.toString()}, Digest logs: ${header.digest.logs.length}`)
  console.log(
    `Weight(refTime): m=${weight.mandatory.refTime} n=${weight.normal.refTime} o=${weight.operational.refTime}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
