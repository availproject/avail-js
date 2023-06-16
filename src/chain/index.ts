import { ApiPromise, WsProvider } from "@polkadot/api"
import { cryptoWaitReady } from "@polkadot/util-crypto"
import { rpc, signedExtensions, types } from "../spec"
import { ApiOptions } from "@polkadot/api/types"

export let api: ApiPromise
export let chainEndpoint = "wss://kate.avail.tools/ws"

/**
 * This function initializes a connection to a blockchain endpoint, using the Polkadot JS API.
 *
 * @param {string} [endpoint] The URL of the blockchain endpoint to connect to. If provided, it will override any previously set endpoint.
 * @param {ApiOptions} [options] Options for the Polkadot JS API. These will be merged with default options.
 *
 * @returns {Promise<ApiPromise>} A promise that resolves to an instance of `ApiPromise`, representing the established API connection.
 */
export const initialize = async (endpoint?: string, options?: ApiOptions): Promise<ApiPromise> => {
  if (endpoint) chainEndpoint = endpoint
  await cryptoWaitReady()
  await disconnect()
  const wsProvider = new WsProvider(chainEndpoint)
  const opt = {
    provider: wsProvider,
    noInitWarn: true,
    types,
    rpc,
    signedExtensions,
    ...options,
  }
  api = await ApiPromise.create(opt)
  return api
}

/**
 * Checks if a connection to the blockchain endpoint is currently established.
 *
 * @returns {boolean} Returns `true` if a connection is currently established, `false` otherwise.
 */
export const isConnected = (): boolean => {
  return Boolean(api && api.isConnected)
}

/**
 * This function disconnects from a currently connected blockchain endpoint.
 * It first checks if a connection is currently established, and if so, it disconnects from it.
 *
 * @returns {Promise<void>} A promise that resolves when the disconnection is complete.
 */
export const disconnect = async (): Promise<void> => {
  if (isConnected()) {
    await api.disconnect()
  }
}
