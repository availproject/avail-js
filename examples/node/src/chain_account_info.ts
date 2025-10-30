import { AvailError, Client, TURING_ENDPOINT } from "avail-js"

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  // Account Info
  const charlie = "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"
  const bestAccountInfo = await client.best().accountInfo(charlie)
  const finalizedAccountInfo = await client.finalized().accountInfo(charlie)
  const accountInfo = await client.chain().accountInfo(charlie, 2000000)
  if (bestAccountInfo instanceof AvailError) throw bestAccountInfo
  if (finalizedAccountInfo instanceof AvailError) throw finalizedAccountInfo
  if (accountInfo instanceof AvailError) throw accountInfo
  console.log(`Best Block Charlie      Nonce: ${bestAccountInfo.nonce}, Free Balance: ${bestAccountInfo.data.free}`)
  console.log(
    `Finalized Block Charlie Nonce: ${finalizedAccountInfo.nonce}, Free Balance: ${finalizedAccountInfo.data.free}`,
  )
  console.log(`Block 2000000 Charlie   Nonce: ${accountInfo.nonce}, Free Balance: ${accountInfo.data.free}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Best Block Charlie      Nonce: 299, Free Balance: 91772963578991329207
  Finalized Block Charlie Nonce: 299, Free Balance: 91772963578991329207
  Block 2000000 Charlie   Nonce: 294, Free Balance: 92395139049599405067
*/
