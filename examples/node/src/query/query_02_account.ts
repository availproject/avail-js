import { Client, LOCAL_ENDPOINT, Keyring } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const signer = new Keyring({ type: 'sr25519' }).addFromUri('//Bob')
  const accountId = signer.address

  const bestInfo = await client.best().accountInfo(accountId)
  console.log(`Best: nonce=${bestInfo.nonce}, balance=${bestInfo.data.free.toString()}`)

  const finalizedInfo = await client.finalized().accountInfo(accountId)
  console.log(`Finalized: nonce=${finalizedInfo.nonce}, balance=${finalizedInfo.data.free.toString()}`)

  const historicalInfo = await client.chain().accountInfo(accountId, 1)
  console.log(`At block 1: nonce=${historicalInfo.nonce}, balance=${historicalInfo.data.free.toString()}`)

  const nonce = await client.chain().accountNonce(accountId)
  const balance = await client.best().accountBalance(accountId)
  console.log(`Current: nonce=${nonce}, balance=${balance.free.toString()}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
