import { AvailError, Client, MAINNET_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(MAINNET_ENDPOINT)
  if (client instanceof AvailError) throw AvailError

  const block = client.block(2042867)

  // Fetching Block Timestamp
  const timestamp = await block.timestamp()
  if (timestamp instanceof AvailError) throw timestamp

  // Converting Block Timestamp to DateTime (Adding two hours to match my timezone)
  const date = new Date(timestamp.toNumber())
  const dateTime = `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()} ${date.getUTCHours() + 2}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`
  console.log(`1. Timestamp: ${timestamp.toString()} Date Time: ${dateTime}`)

  // Event Count & Extrinsic Count
  const eventCount = await block.eventCount()
  const extrinsicCount = await block.extrinsicCount()
  if (eventCount instanceof AvailError) throw eventCount
  if (extrinsicCount instanceof AvailError) throw extrinsicCount
  console.log(`2. Event Count: ${eventCount}, Extrinsic Count: ${extrinsicCount}`)

  // Author, Header Info
  const author = await block.author()
  const header = await block.header()
  if (author instanceof AvailError) throw author
  if (header instanceof AvailError) throw header

  console.log(`3. Block Height: ${header.number}, Block Author: ${author.toSS58()}, Block Hash: ${header.hash.toHex()}, 
              Block Parent Hash: ${header.parentHash}, Extrinsic Root: ${header.extrinsicsRoot}, State Root: ${header.stateRoot}`)

  // Simple Block Height and hash information
  const info = await block.info()
  if (info instanceof AvailError) throw info
  console.log(`Block Height: ${info.height}, Block Hash: ${info.hash.toString()}`)

  // Extrinsic and Block Weight
  const extrinsicWeight = await block.extrinsicWeight()
  const blockWeight = await block.weight()
  if (extrinsicWeight instanceof AvailError) throw extrinsicWeight
  if (blockWeight instanceof AvailError) throw blockWeight

  const weight = blockWeight.mandatory.refTime.add(blockWeight.normal.refTime).add(blockWeight.operational.refTime)
  console.log(`4. Extrinsic Weight: ${extrinsicWeight.refTime}, Block Weight: ${weight.toString()}`)

  // Logs (Digest)
  const head = block.header()
  if (head instanceof AvailError) throw head
  console.log(`5. Logs (Digest) Count: ${header.digest.logs.length}`)

  process.exit()
}

main().catch((e) => console.log(e))
