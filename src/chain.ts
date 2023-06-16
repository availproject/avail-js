import { ApiPromise, WsProvider } from "@polkadot/api"
import { cryptoWaitReady } from "@polkadot/util-crypto"
import { rpc, signedExtensions, types } from "./spec"

export let api: ApiPromise
export let chainEndpoint = "wss://kate.avail.tools"

export const initialize = async (endpoint?: string): Promise<ApiPromise> => {
    if (endpoint) chainEndpoint = endpoint
    await cryptoWaitReady()
    disconnect()
    const wsProvider = new WsProvider(chainEndpoint)
    api = await ApiPromise.create({
        provider: wsProvider,
        types,
        rpc,
        signedExtensions
    })
    return api
}

export const isConnected = (): boolean => {
    return Boolean(api && api.isConnected)
}

export const disconnect = async (): Promise<void> => {
    if (isConnected()) await api.disconnect()
}
