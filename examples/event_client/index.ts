import { Client, LOCAL_ENDPOINT, TransactionReceipt } from "./../../src/client/index"
import {
  DecodedTransaction,
  OpaqueTransaction,
  H256,
  GeneralError,
  avail,
  Hex,
  alice,
  TransactionCallCodec,
  EventCodec,
} from "../../src/core"
import { assertEq } from "./../index"
import { fetchEventsV1Types } from "./../../src/core/rpc/system"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof GeneralError) throw new Error(client.value)
  process.exit(0)
}

main()

function printEvents(events: fetchEventsV1Types.RuntimeEvent[]) {
  for (const event of events) {
    console.log(
      `Event Index: ${event.index}, Pallet Id: ${event.emitted_index[0]}, Variant Id: ${event.emitted_index[1]}`,
    )
    const encodedEvent = event.encoded!
    console.log(`Event (hex and string) encoded value: 0x${encodedEvent}`)

    if (event.decoded != null) {
      console.log(`Event (hex and string) decoded value: 0x${event.decoded}`)
    }
  }
}
