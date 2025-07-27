import {
  Keyring,
  cryptoWaitReady,
  AccountId,
  Client,
  TURING_ENDPOINT,
  LOCAL_ENDPOINT,
  GeneralError,
} from "./../../src/client/index"
import { assertEq } from "./../index"

const main = async () => {
  const client = await Client.create(LOCAL_ENDPOINT)
  if (client instanceof GeneralError) {
    process.exit()
  }
}

main()
