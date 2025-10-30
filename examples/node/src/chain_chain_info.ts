import { AvailError, Client, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Chain Info
  const chainInfo = await client.chain().chainInfo()
  if (chainInfo instanceof AvailError) throw chainInfo

  console.log(`Best      Hash: ${chainInfo.bestHash}, Height: ${chainInfo.bestHeight}`)
  console.log(`Finalized Hash: ${chainInfo.finalizedHash}, Height: ${chainInfo.bestHeight}`)
  console.log(`Genesis   Hash: ${chainInfo.genesisHash}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Best      Hash: 0xc5662c374b9028246e038b2de34c7876edf889945a459eb20c85ac678b809ee4, Height: 2505891
  Finalized Hash: 0x8815dd791bc0437e2ba86402e4f514008a9ebc624530bf79d24e4c5a3e9729b2, Height: 2505891
  Genesis   Hash: 0xd3d2f3a3495dc597434a99d7d449ebad6616db45e4e4f178f31cc6fa14378b70
*/
