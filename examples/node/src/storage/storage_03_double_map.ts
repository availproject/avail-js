import { Client, TURING_ENDPOINT, StorageDoubleMap, avail, AccountId, H256 } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)
  const endpoint = client.endpoint()

  const blockHash = H256.from('0xd81274fdfdcca5cd764d301f4d34aafb797ff466bd73bd2fc4a3ca5108ac2f6a', true)
  const era = 582
  const account = AccountId.from('5HpkbR8i5cf87grRKxmYssuVzuVeXaakv4TJLyMEQDdvfxJa', true)

  const prefs = await StorageDoubleMap.fetch(
    avail.staking.storage.ErasValidatorPrefs,
    endpoint,
    era,
    account,
    blockHash,
  )

  console.log(`ValidatorPrefs: ${prefs ? 'found' : 'none'}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
