import { Decoder } from "../src/core/decoder"
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


class Nuts {
  public data: Uint8Array
  public constructor(data: Uint8Array) { this.data = data }

  static decodeCall(value: Uint8Array): Nuts | null {
    const decoder = new Decoder(value, 0)
    const dispatchIndex = [decoder.decodeU8(), decoder.decodeU8()]
    if (dispatchIndex[0] != 29 || dispatchIndex[1] != 1) {
      return null
    }
    const data = decoder.bytesWLen()
    return new Nuts(data)
  }
}

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  const blockClient = client.blockClient()
  const value = await blockClient.transactionStatic(Nuts, 2, 1);
  console.log(value)

  process.exit()
}

main()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
