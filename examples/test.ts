import { OpaqueTransaction } from "../src/core/decode_transaction"
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

class SubmitData {
  public data: Uint8Array
  public constructor(data: Uint8Array) {
    this.data = data
  }

  static dispatchIndex(): [number, number] {
    return [29, 1]
  }

  static decode(value: Uint8Array): SubmitData | null {
    const decoder = new Decoder(value, 0)
    const data = decoder.bytesWLen()
    return new SubmitData(data)
  }
}

const main = async () => {
  /*   const client = await Client.create(LOCAL_ENDPOINT)
    const blockClient = client.blockClient()
    const value = await blockClient.transactionStatic(SubmitData, 3, 1);
    console.log(value)
   */

  const t =
    "0xb1018400d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d018621ebdce18993d2a729aa95e6ca0b58727632bd8fa4828dd36aac4cf6420b3169ce537545bac83f0dc2dd2deb40a7bd631bde5ca73a2ad8075ca2e24c3f228b85010400001d010461"
  const tx = OpaqueTransaction.decodeHex(t)
  console.log(tx)

  process.exit()
}

main()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
