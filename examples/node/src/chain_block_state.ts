import { AvailError, Client, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Block State
  const chainInfo = await client.chain().chainInfo()
  if (chainInfo instanceof AvailError) throw chainInfo

  const bestBlockState = await client.chain().blockState(chainInfo.bestHeight)
  const finalizedBlockState = await client.chain().blockState(chainInfo.finalizedHeight)
  const historicalBlockState = await client.chain().blockState(2000000)
  const nonExistingBlockState = await client.chain().blockState(100000000)
  if (bestBlockState instanceof AvailError) throw bestBlockState
  if (finalizedBlockState instanceof AvailError) throw finalizedBlockState
  if (historicalBlockState instanceof AvailError) throw historicalBlockState
  if (nonExistingBlockState instanceof AvailError) throw nonExistingBlockState

  console.log(`Best Block State:                     ${bestBlockState}`)
  console.log(`Finalized Block State:                ${finalizedBlockState}`)
  console.log(`Historical (2000000) Block State:     ${historicalBlockState}`)
  console.log(`Non Existing (100000000) Block State: ${nonExistingBlockState}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Best Block State:                     Included
  Finalized Block State:                Finalized
  Historical (2000000) Block State:     Finalized
  Non Existing (100000000) Block State: DoesNotExist
*/
