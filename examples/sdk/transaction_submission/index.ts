import { assertEq } from ".."
import { ClientError } from "../../../src/sdk/error"
import { EventCodec } from "../../../src/sdk/interface"
import { VecU8, VecU82 } from "../../../src/sdk/types/scale/types"
import { avail, Client, LOCAL_ENDPOINT } from "./../../../src/sdk"
import { alice } from "./../../../src/sdk/accounts"
import { dataAvailability } from "./../../../src/sdk/types/pallets"

const main = async () => {
  // dataAvailability.StorageMap.fetch(new dataAvailability.storage.AppKeys(), new VecU82(new Uint8Array()))
  // dataAvailability.StorageMap.fetch(dataAvailability.storage.AppKeys, new Uint8Array());

  // dataAvailability.storage.AppKeys.fetch();
  // dataAvailability.storage.AppKeys.fetch()

  process.exit(0)
}

main()
