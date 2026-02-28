import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const blockHash = await client.chain().blockHash(2000000)
  if (blockHash == null) {
    throw new Error("Block hash not found")
  }

  const encoded = await client.chain().systemFetchExtrinsics(blockHash, { encodeAs: "Extrinsic" })
  const none = await client.chain().systemFetchExtrinsics(blockHash, { encodeAs: "None" })
  const daOnly = await client
    .chain()
    .systemFetchExtrinsics(blockHash, { encodeAs: "None", filter: { PalletCall: [[29, 1]] } })

  console.log(`encoded=${encoded.length} none=${none.length} daOnly=${daOnly.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
