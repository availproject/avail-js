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

  console.log(
    `3. Block Height: ${header.number}, Block Author: ${author.toSS58()}, Block Hash: ${header.hash.toHex()}, Block Parent Hash: ${header.parentHash}, Extrinsic Root: ${header.extrinsicsRoot}, State Root: ${header.stateRoot}`,
  )

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

/* 
  Expected Output:

  1. Timestamp: 1760954220001 Date Time: 20/10/2025 11:57:0
  2. Event Count: 3, Extrinsic Count: 2
  3. Block Height: 2042867, Block Author: 5HeP6FZoHcDJxGgF4TauP4yyZGfDTzZtGB28RHvxXjRSm6h6, Block Hash: 0x45c4fb5b83053dc5816eb0d532eba7dbd971921946dd56031937542291de5a7d, Block Parent Hash: 0x625b3e9d563d73a4a639ca82ccbe4e2c97c931ff339f5148ea31ea66fe1ec576, Extrinsic Root: 0x0eb97eb36ef9f9a265c633682c0c10c2859719b55edb41d6c782bfb3c1be7dde, State Root: 0x336c40c0ca6f175570d1c489512d3f4fc5a1e5be9fd3fe565009e2a4c8da5c90
  Block Height: 2042867, Block Hash: 0x45c4fb5b83053dc5816eb0d532eba7dbd971921946dd56031937542291de5a7d
  4. Extrinsic Weight: 25047612000, Block Weight: 28104773000
  5. Logs (Digest) Count: 2
*/
