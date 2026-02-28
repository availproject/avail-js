import { Client, LOCAL_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const chainInfo = await client.chain().chainInfo()
  const bestHash = await client.best().blockHash()
  const bestHeight = await client.best().blockHeight()
  const finalizedHash = await client.finalized().blockHash()
  const finalizedHeight = await client.finalized().blockHeight()

  const header = await client.chain().blockHeader(1)
  const author = await client.chain().blockAuthor(1)
  const nonce = await client.chain().blockNonce(author, 1)
  const weight = await client.chain().blockWeight(1)
  const timestamp = await client.chain().blockTimestamp((await client.chain().blockHash(1))!.toString())
  const eventCount = await client.chain().blockEventCount(1)
  const block = client.block(bestHash)
  const extrinsics = await block.extrinsics().all({ encodeAs: "Extrinsic" })

  console.log(`chainInfo best=${chainInfo.bestHeight} finalized=${chainInfo.finalizedHeight}`)
  console.log(
    `best=(${bestHeight}, ${bestHash.toString()}) finalized=(${finalizedHeight}, ${finalizedHash.toString()})`,
  )
  console.log(`header1=${header?.number.toString() ?? "n/a"} author=${author.toString()} nonce=${nonce}`)
  console.log(`eventCount=${eventCount} extrinsicCount=${extrinsics.length} timestamp=${timestamp}`)
  const totalWeight = weight.mandatory.refTime.add(weight.normal.refTime).add(weight.operational.refTime)
  console.log(`weight total=${totalWeight.toString()}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
