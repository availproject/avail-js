import { Client, TURING_ENDPOINT, AccountId } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  const account = AccountId.from('5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y', true)
  const nonceHex = await client
    .chain()
    .runtimeApiRawCall('AccountNonceApi_account_nonce', account.encode())

  console.log(`Nonce for Charlie: ${nonceHex}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
