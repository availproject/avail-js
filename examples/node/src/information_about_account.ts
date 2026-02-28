import { Client, Keyring, LOCAL_ENDPOINT } from "avail-js-sdk"

async function main() {
  const seed = "bottom drive obey lake curtain smoke basket hold race lonely fit walk//Charlie"
  const signer = new Keyring({ type: "sr25519" }).addFromUri(seed)
  const client = await Client.connect(LOCAL_ENDPOINT)

  const nonce = await client.chain().accountNonce(signer.address)
  const balance = await client.best().accountBalance(signer.address)
  const bestInfo = await client.best().accountInfo(signer.address)
  const finalizedInfo = await client.finalized().accountInfo(signer.address)
  const customInfo = await client.chain().accountInfo(signer.address, 1)

  console.log(`Account: ${signer.address}`)
  console.log(`Nonce: ${nonce}, Free: ${balance.free.toString()}`)
  console.log(`Best nonce=${bestInfo.nonce}, Finalized nonce=${finalizedInfo.nonce}, Custom nonce=${customInfo.nonce}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
