import { Client, Keyring, LOCAL_ENDPOINT, ONE_AVAIL } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const blobHash = "0x59cad5948673622c1d64e2322488bf01619f7ff45789741b15a9f782ce9290a8"
  const commitments = new Uint8Array(
    Buffer.from(
      "8adc43b724bedae8b4b593b9e10f2b251ef435a02c119100d5d81297e9c8fe1774a4e81d9e21ba50bd402461fd9080d0",
      "hex",
    ),
  )

  const tx = client.tx().dataAvailability().submitBlobMetadata(2, blobHash, 32, commitments, null, null)
  const alice = new Keyring({ type: "sr25519" }).addFromUri("//Alice")
  const signed = await tx.sign(alice, { app_id: 0, tip: ONE_AVAIL })

  const blob = new Uint8Array(Buffer.from("4141414141414141414141414141414141414141414141414141414141414141", "hex"))
  await client.chain().blobSubmitBlob(signed.toU8a(), blob)

  const info = await client.chain().blobGetBlobInfo(blobHash)
  console.log(`blob info hash=${info.hash} block=${info.blockNumber}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
