import { Client, Keyring, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const keyring = new Keyring({ type: "sr25519" })
  const charlie = keyring.addFromUri("//Charlie")

  const client = await Client.connect(TURING_ENDPOINT)
  const nonce = await client.chain().accountNonce(charlie.address)
  const balance = await client.best().accountBalance(charlie.address)

  console.log(`Account: ${charlie.address}`)
  console.log(`Nonce: ${nonce}, Free Balance: ${balance.free.toString()}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
