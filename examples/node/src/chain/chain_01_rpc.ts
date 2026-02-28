import { Client, TURING_ENDPOINT } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const blockHash = await client.chain().rpcRawCall('chain_getBlockHash', [2_000_000])
  console.log(`Block hash at 2000000: ${JSON.stringify(blockHash)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
