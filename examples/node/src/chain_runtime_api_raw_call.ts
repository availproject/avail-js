import { AvailError, Client, TURING_ENDPOINT } from "avail-js"
import { AccountId } from "avail-js/core/metadata"
import { Decoder, U32 } from "avail-js/core/scale"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  const accountId = AccountId.from("5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y")
  if (accountId instanceof AvailError) throw accountId

  // RPC Raw Call
  const response = await client.chain().runtimeApiRawCall("AccountNonceApi_account_nonce", accountId.value)
  if (response instanceof AvailError) throw response

  const decoder = Decoder.from(response)
  if (decoder instanceof AvailError) throw decoder
  const nonce = U32.decode(decoder)
  if (nonce instanceof AvailError) throw nonce

  console.log(`AccountNonceApi_account_nonce: Charlie Nonce: ${nonce}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  AccountNonceApi_account_nonce: Charlie Nonce: 299
*/
