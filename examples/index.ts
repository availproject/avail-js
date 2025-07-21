import { Keyring } from "@polkadot/api"
import { Client, SubmittableTransaction, Core } from "./../src/client/index"

const main = async () => {
  const client = await Client.create("http://127.0.0.1:9944", true)
  const alice = new Keyring({ type: "sr25519" }).addFromUri("//Alice")
  const tx = client.api.tx.dataAvailability.submitData("Hello World")
  const st = new SubmittableTransaction(client, tx.toU8a())
  const sd = await st.signAndSubmit(alice, { app_id: 2 })
  const receipt = await sd.receipt(false);
  console.log(receipt)
  const state = await receipt!.blockState()
  console.log(state)
  const events = await receipt!.txEvents()
  console.log(events)
}

main()
  .catch((v) => {
    console.log(v)
    process.exit(1)
  })
  .then((_v) => {
    process.exit()
  })

export function assert_eq<T>(v1: T, v2: T, message?: string) {
  if (v1 !== v2) {
    throw new Error(`Failure. Actual ${v1}, Expected: ${v2}. ${message}`)
  }
}

export function assert_ne<T>(v1: T, v2: T, message?: string) {
  if (v1 === v2) {
    throw new Error(`Failure. Actual ${v1}, Expected: ${v2}. ${message}`)
  }
}

export function assert_true(v: boolean, message?: string) {
  if (!v) {
    throw new Error(`Failure. ${message}`)
  }
}

export function throw_error(message?: string) {
  throw new Error(`Failure. ${message}`)
}
