import { AvailError, Client, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Block Info
  const bestBlockInfo = await client.best().blockInfo()
  const finalizedBlockInfo = await client.finalized().blockInfo()
  if (bestBlockInfo instanceof AvailError) throw bestBlockInfo
  if (finalizedBlockInfo instanceof AvailError) throw finalizedBlockInfo
  console.log(`Best      Hash: ${bestBlockInfo.hash}, Height: ${bestBlockInfo.height}`)
  console.log(`Finalized Hash: ${finalizedBlockInfo.hash}, Height: ${finalizedBlockInfo.height}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Best      Hash: 0x1b8c817585a320262e46ffe5282590805bb915b3c5586a382376626d01a57784, Height: 2505866
  Finalized Hash: 0xdc8e3dadc575996e6eaede7194069e20a9d577c27d6252c7a75288ef24d1deed, Height: 2505865
*/
