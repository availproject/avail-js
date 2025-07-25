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
  avail,
  SubmittableTransaction,
} from "./../src/client/index"
import { assertEq } from "./index"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)

  const tx = client.api.tx.dataAvailability.submitData("12")
  const abc = new SubmittableTransaction(client, tx)

  /*   const call = new avail.DataAvailability.Tx.SubmitData(new Uint8Array([51]));
    const submittable = SubmittableTransaction.fromCall(client, call);
    console.log(submittable.call) */
  const submitted = await abc.signAndSubmit(Core.accounts.alice(), {})
  const receipt = await submitted.receipt(false)
  console.log(receipt)

  /*   const t =
      "0xb1018400d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d018621ebdce18993d2a729aa95e6ca0b58727632bd8fa4828dd36aac4cf6420b3169ce537545bac83f0dc2dd2deb40a7bd631bde5ca73a2ad8075ca2e24c3f228b85010400001d010461"
    const tx = OpaqueTransaction.decodeHex(t)
    console.log(tx)
   */
  process.exit()
}

main()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
