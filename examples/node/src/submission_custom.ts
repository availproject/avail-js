import { avail, AvailError, Client, Keyring, ONE_AVAIL, TURING_ENDPOINT } from "avail-js"
import { addHeader } from "avail-js/core/interface"
import { Decoder } from "avail-js/core/scale/decoder"
import { Encoder } from "avail-js/core/scale/encoder"
import { SubmittableTransaction } from "avail-js/submission"

class CustomExtrinsic extends addHeader(29, 1) {
  constructor(public data: Uint8Array) {
    super()
  }

  encode(): Uint8Array {
    return Encoder.vecU8(this.data)
  }

  static decode(decoder: Decoder): CustomExtrinsic | AvailError {
    const data = decoder.vecU8()
    if (data instanceof AvailError) return data

    return new CustomExtrinsic(data)
  }
}

async function main() {
  const client = await Client.create(TURING_ENDPOINT)
  if (client instanceof AvailError) throw client

  const custom = new CustomExtrinsic(new Uint8Array([66, 66, 77, 77]))

  // Submission
  const submittable = SubmittableTransaction.from(client, custom)
  const signer = new Keyring({ type: "sr25519" }).addFromUri("//Bob")
  const submitted = await submittable.signAndSubmit(signer, { app_id: 2 })
  if (submitted instanceof AvailError) throw submitted
  console.log(`Ext Hash: ${submitted.extHash}`)

  // Getting Extrinsic Receipt
  const receipt = await submitted.receipt(false)
  if (receipt instanceof AvailError) throw receipt
  if (receipt == null) throw "Extrinsic was dropped"
  const blockState = await receipt.blockState()
  if (blockState instanceof AvailError) throw blockState
  console.log(`Block State: ${blockState}`)
  console.log(
    `Block Height: ${receipt.blockHeight}, Block Hash: ${receipt.blockHash}, Ext Hash: ${receipt.extHash}, Ext Index: ${receipt.extIndex}`,
  )

  // Fetching Extrinsic Events
  const events = await receipt.events()
  if (events instanceof AvailError) throw events
  const event = events.first(avail.dataAvailability.events.DataSubmitted)
  if (event == null) throw "Failed to find DataSubmitted event"
  console.log(`Is Successful: ${events.isExtrinsicSuccessPresent()}, Who: ${event.who}, Data Hash: ${event.dataHash}`)

  // Fetching Extrinsic itself
  const ext = await receipt.extrinsic(avail.dataAvailability.tx.SubmitData)
  if (ext instanceof AvailError) throw ext
  console.log(`Data: ${new TextDecoder().decode(ext.call.data)}`)

  process.exit()
}

main().catch((e) => console.log(e))

/* 
  Expected Output:

  Ext Hash: 0x361a9a5e164e14a66991ad61bd315095975938f6ba530bb5fa1aec699fedf3ed
  Block State: Finalized
  Block Height: 2506351, Block Hash: 0x7cbadfbfa11591e34663d8ffdb1cc5b97a2c77e3816ee490465dca99aa2868d5, Ext Hash: 0x361a9a5e164e14a66991ad61bd315095975938f6ba530bb5fa1aec699fedf3ed, Ext Index: 1
  Is Successful: true, Who: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, Data Hash: 0xdd3b07766319623a7fdb53b802ee8a5b75a194ad4c638f251a209f34d960f859
  Data: BBMM
*/
