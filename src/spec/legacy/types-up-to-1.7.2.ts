export const types = {
  AppId: "Compact<u32>",
  DataLookupIndexItem: {
    appId: "AppId",
    start: "Compact<u32>",
  },
  DataLookup: {
    size: "Compact<u32>",
    index: "Vec<DataLookupIndexItem>",
  },
  KateCommitment: {
    rows: "Compact<u16>",
    cols: "Compact<u16>",
    dataRoot: "H256",
    commitment: "Vec<u8>",
  },
  V1HeaderExtension: {
    commitment: "KateCommitment",
    appLookup: "DataLookup",
  },
  HeaderExtension: {
    _enum: {
      V1: "V1HeaderExtension",
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
  BlockLength: {
    max: "PerDispatchClass",
    cols: "Compact<u32>",
    rows: "Compact<u32>",
    chunkSize: "Compact<u32>",
  },
  PerDispatchClass: {
    normal: "u32",
    operational: "u32",
    mandatory: "u32",
  },
  DataProof: {
    root: "H256",
    proof: "Vec<H256>",
    numberOfLeaves: "Compact<u32>",
    leaf_index: "Compact<u32>",
    leaf: "H256",
  },
  Cell: {
    row: "u32",
    col: "u32",
  },
}
