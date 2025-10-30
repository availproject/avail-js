import { AvailError, Client, Keyring, TURING_ENDPOINT } from "avail-js"
import { accounts } from "avail-js/core"
import { cryptoWaitReady } from "avail-js/core/polkadot"

async function main() {
  // Creating Keypair
  await cryptoWaitReady()
  const seed = "bottom drive obey lake curtain smoke basket hold race lonely fit walk//Charlie"
  const signer = new Keyring({ type: "sr25519" }).addFromUri(seed)
  console.log(`Account SS58 Address: ${signer.address}`)

  // Access to dev accounts
  const _aliceSigner = accounts.alice()
  const _bobSigner = accounts.bob()
  const _charlieSigner = accounts.charlie()
  const _eveSigner = accounts.eve()

  // Random signer
  const _randomSigner = accounts.generate()

  // Nonce & Balance
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  const nonce = await client.chain().accountNonce(signer.address)
  const balance = await client.best().accountBalance(signer.address)
  if (nonce instanceof AvailError) throw nonce
  if (balance instanceof AvailError) throw balance
  console.log(`Charlie Nonce: ${nonce}, Free Balance: ${balance.free.toString()}`)

  // Historical Nonce & Balance
  const accountInfo = await client.chain().accountInfo(signer.address, 2000000)
  if (accountInfo instanceof AvailError) throw accountInfo
  console.log(`Charlie (block 2000000) Nonce: ${accountInfo.nonce}, Free Balance: ${accountInfo.data.free.toString()}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Account SS58 Address: 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y
  Charlie Nonce: 299, Free Balance: 91772963578991329207
  Charlie (block 2000000) Nonce: 294, Free Balance: 92395139049599405067
*/
