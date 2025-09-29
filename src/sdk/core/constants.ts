import { BN } from "./types/polkadot"

export const ONE_AVAIL: BN = new BN("1000000000000000000")
export const TEN_AVAIL: BN = ONE_AVAIL.mul(new BN(10))
export const ONE_HUNDRED_AVAIL: BN = TEN_AVAIL.mul(new BN(10))
export const THOUSAND_AVAIL: BN = ONE_HUNDRED_AVAIL.mul(new BN(10))
export const LOCAL_ENDPOINT = "http://127.0.0.1:9944"
export const LOCAL_WS_ENDPOINT = "ws://127.0.0.1:9944"
export const TURING_ENDPOINT = "https://turing-rpc.avail.so/rpc"
export const TURING_WS_ENDPOINT = "wss://turing-rpc.avail.so/ws"
export const MAINNET_ENDPOINT = "https://mainnet-rpc.avail.so/rpc"
export const MAINNET_WS_ENDPOINT = "wss://mainnet-rpc.avail.so/ws"
