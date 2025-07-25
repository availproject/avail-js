import {
  Keyring,
  cryptoWaitReady,
  AccountId,
  Client,
  TURING_ENDPOINT,
  Core,
  LOCAL_ENDPOINT,
  log,
  MAINNET_ENDPOINT,
} from "./../src/client/index"
import { assertEq } from "./index"

const main = async () => {
  const client = await Client.create(TURING_ENDPOINT)
  let sHeight = 0
  log.warn("Test")
  while (true) {
    const height = await client.bestBlockHeight()

    if (height != sHeight) {
      for (let i = 0; i < 10; ++i) {
        await client.blockHashWithRetries(height)
      }
      sHeight = height
      console.log(`New height: ${sHeight}`)
    }
    await sleep(1)
  }
  const value = await Core.rpc.chain.getBlock(
    LOCAL_ENDPOINT,
    "0xd92e992f02aaf3930fa639663276668fa4e8a4d4022a56470fa12cb110f7d256",
  )
  //console.log(value)

  process.exit()
}

main()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
