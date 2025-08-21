import { isOk } from ".."
import ClientError from "../../../src/sdk/error"
import { makeEvent } from "../../../src/sdk/interface"
import { AccountId, H256 } from "../../../src/sdk/types"
import { u8aConcat } from "../../../src/sdk/types/polkadot"
import { Decoder, Encoder } from "../../../src/sdk/types/scale"
import { Client, LOCAL_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"

class CustomEventData {
  constructor(
    public who: AccountId,
    public dataHash: H256,
  ) {}

  static encode(value: CustomEventData): Uint8Array {
    return u8aConcat(Encoder.any(value.who), Encoder.any(value.dataHash))
  }

  static decode(decoder: Decoder): CustomEventData | ClientError {
    const who = decoder.any(AccountId)
    if (who instanceof ClientError) return who
    const dataHash = decoder.any(H256)
    if (dataHash instanceof ClientError) return dataHash
    return new CustomEventData(who, dataHash)
  }
}
class CustomEvent extends makeEvent({ PALLET_ID: 29, VARIANT_ID: 1, DATA: CustomEventData }) {}

const main = async () => {
  const client = isOk(await Client.create(LOCAL_ENDPOINT))

  const submittable = client.tx().dataAvailability.submitData("abc")
  const submitted = isOk(await submittable.signAndSubmit(alice(), { app_id: 2 }))
  const receipt = isOk((await submitted.receipt(true))!)
  const events = isOk(await receipt.txEvents())

  const runtimeEvent = events.find(
    (x) => [x.palletId, x.variantId].toString() == [CustomEvent.PALLET_ID, CustomEvent.VARIANT_ID].toString(),
  )!
  const customEvent = CustomEvent.decode(runtimeEvent.encoded!)!
  console.log(`Account: ${customEvent.who.toSS58()}, Hash: ${customEvent.dataHash.toHuman()}`)

  process.exit(0)
}

main()
