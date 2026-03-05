import { ApiPromise, WsProvider, HttpProvider } from "@polkadot/api"
import { cryptoWaitReady } from "@polkadot/util-crypto"
import { ApiOptions } from "@polkadot/api/types"
import type { ExtDef } from "@polkadot/types/extrinsic/signedExtensions/types"

export let api: ApiPromise
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
    appId: "Compact<u32>",
    start: "Compact<u32>",
  },
  KateCommitment: {
    rows: "Compact<u16>",
    cols: "Compact<u16>",
    commitment: "Vec<u8>",
    dataRoot: "H256",
  },
  V4CompactDataLookup: {
    size: "Compact<u32>",
    index: "Vec<DataLookupItem>",
    rowsPerTx: "Vec<u16>",
  },
  V4HeaderExtension: {
    appLookup: "V4CompactDataLookup",
    commitment: "KateCommitment",
  },
  KzgHeader: {
    _enum: {
      V4: "V4HeaderExtension",
    },
  },
  FriBlobCommitment: {
    sizeBytes: "u64",
    commitment: "H256",
  },
  FriParamsVersion: {
    _enum: ["V0"],
  },
  FriV1HeaderExtension: {
    blobs: "Vec<FriBlobCommitment>",
    dataRoot: "H256",
    paramsVersion: "FriParamsVersion",
  },
  FriHeader: {
    _enum: {
      V1: "FriV1HeaderExtension",
    },
  },
  HeaderExtension: {
    _enum: {
      Kzg: "KzgHeader",
      Fri: "FriHeader",
    },
  },
  AvailHeader: {
    parentHash: "Hash",
    number: "Compact<BlockNumber>",
    stateRoot: "Hash",
    extrinsicsRoot: "Hash",
    digest: "Digest",
    extension: "HeaderExtension",
  },
  Header: "AvailHeader",
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
 * Initializes a Polkadot API connection for the given endpoint.
 */
export const initialize = async (
  endpoint: string,
  options?: ApiOptions,
  useHttpProvider?: boolean,
): Promise<ApiPromise> => {
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
    opt.provider = new HttpProvider(endpoint)
  } else {
    opt.provider = new WsProvider(endpoint)
  }

  api = await ApiPromise.create(opt)
  return api
}

/**
 * Returns `true` when the shared API instance is connected.
 */
export const isConnected = (): boolean => {
  return Boolean(api && api.isConnected)
}

/**
 * Disconnects the shared API instance if connected.
 */
export const disconnect = async (): Promise<void> => {
  if (isConnected()) {
    await api.disconnect()
  }
}

/**
 * Returns chain decimals from the API registry.
 */
export const getDecimals = (api: ApiPromise): number => {
  return api.registry.chainDecimals[0]
}
