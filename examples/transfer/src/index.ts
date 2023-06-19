import { getDecimals, initialize } from "avail-js-sdk"
import { formatNumberToBalance, getKeyringFromSeed, isValidAddress } from "avail-js-sdk/helpers"

const main = async () => {
  try {
    const seed = "" // Put a seed with some funds here
    const recipient = "" // Put recipient here

    if (!isValidAddress(recipient)) throw new Error("Invalid Recipient")

    const api = await initialize()
    const keyring = getKeyringFromSeed(seed)
    const options = { app_id: 0, nonce: -1 }
    const decimals = getDecimals(api)
    const amount = formatNumberToBalance(1, decimals)

    await api.tx.balances.transfer(recipient, amount).signAndSend(keyring, options)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
main()
