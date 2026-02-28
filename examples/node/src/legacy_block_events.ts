import { Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const hash1 = await client.chain().blockHash(2923704)
  if (hash1 != null) {
    const events1 = await client.chain().blockEventsEncoded(hash1)
    console.log(`block=2923704 legacyEncodedEvents=${events1.length}`)
  }

  const hash2 = await client.chain().blockHash(116749)
  if (hash2 != null) {
    const events2 = await client.chain().blockEventsEncoded(hash2)
    console.log(`block=116749 legacyEncodedEvents=${events2.length}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
