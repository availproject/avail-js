import { initialize, getKeyringFromSeed } from "avail-js-sdk"

const main = async () => {
  try {
    const seed = "" // Put a seed with some funds here
    const data = "Any data"

    const api = await initialize()
    const keyring = getKeyringFromSeed(seed)
    const options = { app_id: 0, nonce: -1 }

    await api.tx.dataAvailability.submitData(data).signAndSend(keyring, options)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
main()
