import { AvailError, Client, TURING_ENDPOINT } from "avail-js"
import { U32 } from "avail-js/core/scale"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // RPC Raw Call
  const response = await client.chain().rpcRawCall("chain_getBlockHash", [2000000])
  if (response instanceof AvailError) throw response
  if (response.error != null) throw AvailError.from(response.error)
  const blockHash = response.result as string | null
  if (blockHash == null) throw "Failed to fetch blockHash"
  console.log(`chain_getBlockHash: Block Hash: ${blockHash}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  chain_getBlockHash: Block Hash: 0x6831d536cc3d6408a41a1e50d66f4f48c9c2ed5ffc7cfa7505a5f0251365428f
*/
