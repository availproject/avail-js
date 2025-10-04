import { ApiPromise, WsProvider, HttpProvider } from "@polkadot/api"
import { cryptoWaitReady } from "@polkadot/util-crypto"
import { ApiOptions } from "@polkadot/api/types"
import type { ExtDef } from "@polkadot/types/extrinsic/signedExtensions/types"

export const MAINNET_ENDPOINT_OLD = "wss://mainnet-rpc.avail.so/ws"
export const TURING_ENDPOINT_OLD = "wss://turing-rpc.avail.so/ws"

export let api: ApiPromise
export let chainEndpoint = TURING_ENDPOINT_OLD

export const signedExtensions: ExtDef = {
  CheckAppId: {
    extrinsic: {
      appId: "AppId",
    },
    payload: {},
  },
}

export const rpc = {}

export const types = {
  AppId: "Compact<u32>",
  DataLookupItem: {
    appId: "AppId",
    start: "Compact<u32>",
  },
  CompactDataLookup: {
    size: "Compact<u32>",
    index: "Vec<DataLookupItem>",
  },
  KateCommitment: {
    rows: "Compact<u16>",
    cols: "Compact<u16>",
    commitment: "Vec<u8>",
    dataRoot: "H256",
  },
  V3HeaderExtension: {
    appLookup: "CompactDataLookup",
    commitment: "KateCommitment",
  },
  HeaderExtension: {
    _enum: {
      V1: null,
      V2: null,
      V3: "V3HeaderExtension",
    },
  },
  DaHeader: {
    parentHash: "Hash",
    number: "Compact<BlockNumber>",
    stateRoot: "Hash",
    extrinsicsRoot: "Hash",
    digest: "Digest",
    extension: "HeaderExtension",
  },
  Header: "DaHeader",
  CheckAppIdExtra: {
    appId: "AppId",
  },
  CheckAppIdTypes: {},
  CheckAppId: {
    extra: "CheckAppIdExtra",
    types: "CheckAppIdTypes",
  },
  BlockLengthColumns: "Compact<u32>",
  BlockLengthRows: "Compact<u32>",
  BlockLength: {
    max: "PerDispatchClass",
    cols: "BlockLengthColumns",
    rows: "BlockLengthRows",
    chunkSize: "Compact<u32>",
  },
  PerDispatchClass: {
    normal: "u32",
    operational: "u32",
    mandatory: "u32",
  },
  DataProof: {
    roots: "TxDataRoots",
    proof: "Vec<H256>",
    numberOfLeaves: "Compact<u32>",
    leafIndex: "Compact<u32>",
    leaf: "H256",
  },
  TxDataRoots: {
    dataRoot: "H256",
    blobRoot: "H256",
    bridgeRoot: "H256",
  },
  ProofResponse: {
    dataProof: "DataProof",
    message: "Option<AddressedMessage>",
  },
  AddressedMessage: {
    message: "Message",
    from: "H256",
    to: "H256",
    originDomain: "u32",
    destinationDomain: "u32",
    data: "Vec<u8>",
    id: "u64",
  },
  Message: {
    _enum: {
      ArbitraryMessage: "ArbitraryMessage",
      FungibleToken: "FungibleToken",
    },
  },
  MessageType: {
    _enum: ["ArbitraryMessage", "FungibleToken"],
  },
  FungibleToken: {
    assetId: "H256",
    amount: "String",
  },
  BoundedData: "Vec<u8>",
  ArbitraryMessage: "BoundedData",
  Cell: {
    row: "u32",
    col: "u32",
  },
}

/**
 * This function initializes a connection to a blockchain endpoint, using the Polkadot JS API.
 *
 * @param {string} [endpoint] The URL of the blockchain endpoint to connect to. If provided, it will override any previously set endpoint.
 * @param {ApiOptions} [options] Options for the Polkadot JS API. These will be merged with default options.
 *
 * @returns {Promise<ApiPromise>} A promise that resolves to an instance of `ApiPromise`, representing the established API connection.
 */
export const initialize = async (
  endpoint?: string,
  options?: ApiOptions,
  useHttpProvider?: boolean,
): Promise<ApiPromise> => {
  if (endpoint) chainEndpoint = endpoint
  await cryptoWaitReady()
  await disconnect()

  const opt = {
    noInitWarn: true,
    types,
    rpc,
    signedExtensions,
    ...options,
  }

  if (useHttpProvider !== undefined && useHttpProvider === true) {
    opt.provider = new HttpProvider(chainEndpoint)
  } else {
    opt.provider = new WsProvider(chainEndpoint)
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

/**
 * This function get the number of decimals from the chain registry.
 *
 * @param {ApiPromise} api the api promise of the chain.
 *
 * @returns {number} The number of decimals of the chain from the api promise.
 */
export const getDecimals = (api: ApiPromise): number => {
  return api.registry.chainDecimals[0]
}
