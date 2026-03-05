import { bob, Client, LOCAL_ENDPOINT } from "avail-js-sdk" // Global import

/**
 * Example to connect to a chain and get the ApiPromise.
 */
const main = async () => {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const signer = bob()
  const accountId = signer.address

  // Fetching account relevant information
  //
  // The easiest way to fetch account information like balance or nonce is via
  // .account() interface.
  // The following information can be fetched:
  // - .info()	- Account Nonce + Balance + Metadata
  // - .nonce()	- Account Nonce
  // - .balance()	- Account balance
  // The first input is the account id (can be string) and the second input is
  // block query mode.
  await client.account().info(accountId)
  await client.account().nonce(accountId)
  await client.account().balance(accountId)

  // If information from historical blocks are needed there are .*_at() methods
  // that can facilitate that
  await client.account().infoAt(accountId, 1)
  await client.account().nonceAt(accountId, 1)
  await client.account().balanceAt(accountId, 1)

  process.exit(0)
}
main()
