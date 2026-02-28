import { Block, Client, LOCAL_ENDPOINT } from 'avail-js-sdk'

async function main() {
  const client = await Client.connect(LOCAL_ENDPOINT)

  const best = client.best()
  const finalized = client.finalized()

  const [bestHash, bestHeight] = await Promise.all([best.blockHash(), best.blockHeight()])
  const [finalizedHash, finalizedHeight] = await Promise.all([finalized.blockHash(), finalized.blockHeight()])

  console.log(`Best: hash=${bestHash}, height=${bestHeight}`)
  console.log(`Finalized: hash=${finalizedHash}, height=${finalizedHeight}`)

  const header = await best.blockHeader()
  console.log(`Header: number=${header.number.toString()}`)

  const block = new Block(client, bestHeight)
  const info = await block.info()
  const author = await block.author()
  const timestamp = await block.timestamp()
  console.log(`Block ${info.height}: author=${author}, timestamp=${timestamp}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
