import { SdkError, Client, TURING_ENDPOINT } from "avail-js-sdk"

async function main() {
  const client = await Client.connect(TURING_ENDPOINT)

  // Block Author
  const blockAuthor = await client.chain().blockAuthor(2000000)
  console.log(`Block 2000000 Author: ${blockAuthor}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Block 2000000 Author: 5GQjARS9nVu5t3NrBZGhdUKKpwdj1xvnek9rNk7UKaH7DHoJ
*/
