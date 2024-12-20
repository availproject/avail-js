import { SDK, Keyring, utils, throwOnErrorOrFailed } from "../../src/sdk"

export async function run() {
  console.log("Session_SetKeys")
  await SetKeys.run()
}

namespace SetKeys {
  export async function run() {
    const sdk = await SDK.New(SDK.localEndpoint())

    const account = new Keyring({ type: "sr25519" }).addFromUri("//Alice//stash")
    const keysBytes = await sdk.api.rpc.author.rotateKeys()
    const keys = utils.deconstruct_session_keys(keysBytes.toString())

    const tx = sdk.tx.session.setKeys(keys)
    const details = throwOnErrorOrFailed(sdk.api, await tx.executeWaitForInclusion(account))

    details.printDebug()
  }
}
