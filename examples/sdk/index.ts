import ClientError from "./../../src/sdk/error"

/* const main = async () => {
  // const a = new Core.avail.DataAvailability.Tx.CreateApplicationKey(new Uint8Array())

  console.log("a")

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
} */

/* main()
  .catch((v) => {
    console.log(v)
    process.exit(1)
  })
  .then((_v) => {
    process.exit()
  })
 */

export function assertEq<T>(v1: T, v2: T, message?: string) {
  if (v1 !== v2) {
    throw new Error(`Failure. Actual ${v1}, Expected: ${v2}. ${message}`)
  }
}

export function assertNe<T>(v1: T, v2: T, message?: string) {
  if (v1 === v2) {
    throw new Error(`Failure. Actual ${v1}, Expected: ${v2}. ${message}`)
  }
}

export function assertTrue(v: boolean, message?: string) {
  if (!v) {
    throw new Error(`Failure. ${message}`)
  }
}

export function throwOnError2<T>(value: T | ClientError): asserts value is Exclude<T, ClientError> {
  if (value instanceof ClientError) throw value
}

export function throwOnError<T>(value: T | ClientError): T {
  throwOnError2(value)
  return value
}

export function isOk<T>(value: T | ClientError): T {
  throwOnError2(value)
  return value
}
