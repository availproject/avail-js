import { Client, H256, LOCAL_ENDPOINT, alice } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const blob = Buffer.from('4141414141414141414141414141414141414141414141414141414141414141', 'hex')
  const blobHash = H256.from('59cad5948673622c1d64e2322488bf01619f7ff45789741b15a9f782ce9290a8', true)
  const commitments = Buffer.from(
    '8adc43b724bedae8b4b593b9e10f2b251ef435a02c119100d5d81297e9c8fe1774a4e81d9e21ba50bd402461fd9080d0',
    'hex',
  )

  const signer = alice()
  const tx = client
    .tx()
    .dataAvailability()
    .submitBlobMetadata(2, blobHash, blob.length, commitments, null, null)

  const signed = await tx.signOnly(signer, {})
  await client.chain().blobSubmitBlob(signed.toU8a(), blob)
  console.log('Blob submitted')

  const fromIndex = await client.chain().blobGetBlob(blobHash)
  console.log(`blobGetBlob (indexed): size=${fromIndex.size}, hash=${fromIndex.blobHash}`)

  const info = await client.chain().blobGetBlobInfo(blobHash)
  console.log(`blobGetBlobInfo: block=${info.blockNumber}, owners=${info.ownership.length}`)

  const proof = await client.chain().blobInclusionProof(blobHash)
  console.log(`blobInclusionProof: leaves=${proof.numberOfLeaves}, leafIndex=${proof.leafIndex}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
