import { SdkError, Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  // Block State
  const chainInfo = await client.chain().chainInfo()

  const bestBlockState = await client.chain().blockState(chainInfo.bestHeight)
  const finalizedBlockState = await client.chain().blockState(chainInfo.finalizedHeight)
  const historicalBlockState = await client.chain().blockState(2000000)
  const nonExistingBlockState = await client.chain().blockState(100000000)

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
