import { BN, SDK, utils, Account } from "./../src/index"

export async function runRpc() {
  const sdk = await SDK.New(SDK.localEndpoint)

  // author.rotateKeys
  const keysBytes = await sdk.client.api.rpc.author.rotateKeys()
  const keys = utils.deconstruct_session_keys(keysBytes.toString())
  console.log("rotateKeys")
  console.log(keys)
  /*
    Output
    {
      babe: '0x8cacb2bc4f7b45cab73616610311c528fbe5c23eb5ba56ec48117544c3f4f162',
      grandpa: '0x507f8feda6cc5dc8c9e32704448ff3a0ce56a3be82cc4abd1a4dc59220900b2a',
      imOnline: '0x601075b15dfa1a08dcc4562ee20ee8717d104d355e4b0b883b13754d4c400c57',
      authorityDiscover: '0x08842016ffc81adc45ce645fd11b16a1b351c82854b8cfc1670e51ff0675b374'
    }
  */

  // chain.getBlock
  const block = await sdk.client.api.rpc.chain.getBlock()
  console.log("getBlock")
  console.log(block.toJSON())
  /*
    Output
    {
      block: {
        header: {
          parentHash: '0x42670561b854f78e6a4e08d5d3f5971f6057e215467fb0684f1a2af17fe8b369',
          number: 707,
          stateRoot: '0xa32347f3ae7ae6d0c534e6cbe0b19148b5a971eb860cdd682428ecf623401a1e',
          extrinsicsRoot: '0x3c9492204d29fc822f5a046d252119f6be0236767c8b16afedfd8457eafd5ec3',
          digest: [Object],
          extension: [Object]
        },
        extrinsics: [ '0x280403000bb0037bf09301', '0x1004270b00' ]
      },
      justifications: null
    }
  */

  // chain.getBlockHash
  const hash = await sdk.client.api.rpc.chain.getBlockHash()
  console.log("getBlockHash")
  console.log(hash.toJSON())
  /*
    Output
    0x2079190e8bf27a01687b3ecdfdbbee4cc4246695b5dc3d40fdd62aa4a2b4a0be
  */

  // chain.getFinalizedHead
  const hash2 = await sdk.client.api.rpc.chain.getFinalizedHead()
  console.log("getFinalizedHead")
  console.log(hash2.toJSON())
  /*
    Output
    {
      parentHash: '0x42670561b854f78e6a4e08d5d3f5971f6057e215467fb0684f1a2af17fe8b369',
      number: 707,
      stateRoot: '0xa32347f3ae7ae6d0c534e6cbe0b19148b5a971eb860cdd682428ecf623401a1e',
      extrinsicsRoot: '0x3c9492204d29fc822f5a046d252119f6be0236767c8b16afedfd8457eafd5ec3',
      digest: { logs: [ [Object], [Object] ] },
      extension: { v3: { appLookup: [Object], commitment: [Object] } }
    }
  */

  // chain.getHeader
  const header = await sdk.client.api.rpc.chain.getHeader()
  console.log("getHeader")
  console.log(header.toJSON())
  /*
    Output
    0x1c1bdd7d76d4366c736e1c6a591fdd9f14ddef87b5ffc0fc2df4a81f3e2b00e6
  */

  // system.accountNextIndex
  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  const nodeNonce: BN = await sdk.client.api.rpc.system.accountNextIndex(address)
  console.log("accountNextIndex")
  console.log(nodeNonce.toNumber())
  /*
    Output
    44
  */

  // system.chain
  const chain = await sdk.client.api.rpc.system.chain()
  console.log("chain")
  console.log(chain.toJSON())
  /*
    Output
    Avail Development Network
  */

  // system_chainType
  const chainType = await sdk.client.api.rpc.system.chainType()
  console.log("chainType")
  console.log(chainType.toString())
  /*
    Output
    Development
  */

  // system.health
  const health = await sdk.client.api.rpc.system.health()
  console.log("health")
  console.log(health.peers.toNumber())
  console.log(health.isSyncing.toString())
  console.log(health.shouldHavePeers.toString())
  /*
    Output
    0
    false
    false
  */

  // system.localListenAddresses
  const localListenAddresses = await sdk.client.api.rpc.system.localListenAddresses()
  console.log("localListenAddresses")
  localListenAddresses.forEach((e) => console.log(e.toString()))
  /*
    Output
    /ip6/fe80::a333:1e13:2097:7c0a/tcp/30333/p2p/12D3KooWNb38SjUDDGAJxytmPPEV1t9Fz65JTw3C87poFFdF5x3n
    /ip4/192.168.1.103/tcp/30333/p2p/12D3KooWNb38SjUDDGAJxytmPPEV1t9Fz65JTw3C87poFFdF5x3n
    /ip4/127.0.0.1/tcp/30333/p2p/12D3KooWNb38SjUDDGAJxytmPPEV1t9Fz65JTw3C87poFFdF5x3n
    /ip6/::1/tcp/30333/p2p/12D3KooWNb38SjUDDGAJxytmPPEV1t9Fz65JTw3C87poFFdF5x3n
  */

  // system.localPeerId
  const localPeerId = await sdk.client.api.rpc.system.localPeerId()
  console.log("localPeerId")
  console.log(localPeerId.toJSON())
  /*
    Output
    12D3KooWNb38SjUDDGAJxytmPPEV1t9Fz65JTw3C87poFFdF5x3n
  */

  // system.name
  const name = await sdk.client.api.rpc.system.name()
  console.log("name")
  console.log(name.toJSON())
  /*
    Output
    Avail Node
  */

  // system.nodeRoles
  const nodeRoles = await sdk.client.api.rpc.system.nodeRoles()
  console.log("nodeRoles")
  nodeRoles.forEach((e) => console.log(e.toString()))
  /*
    Output
    Authority
  */

  // system.peers
  const peers = await sdk.client.api.rpc.system.peers()
  console.log("peers")
  peers.forEach((e) => console.log(e.toString()))
  /*
    Output
    []
  */

  // system.properties
  const properties = await sdk.client.api.rpc.system.properties()
  console.log("properties")
  console.log("isEthereum: " + properties.isEthereum.toString())
  console.log("ss58Format: " + properties.ss58Format.toString())
  if (properties.tokenDecimals.isSome) {
    properties.tokenDecimals.value.forEach((e) => console.log(e.toString()))
  }
  if (properties.tokenSymbol.isSome) {
    properties.tokenSymbol.value.forEach((e) => console.log(e.toString()))
  }
  /*
    Output
    isEthereum: false
    ss58Format: 42
    18
    AVAIL
  */

  // system.syncState
  const syncState = await sdk.client.api.rpc.system.syncState()
  console.log("syncState")
  console.log("startingBlock: " + syncState.startingBlock.toNumber())
  console.log("currentBlock: " + syncState.currentBlock.toNumber())
  if (syncState.highestBlock.isSome) {
    console.log("highestBlock:" + syncState.highestBlock.value.toNumber())
  }
  /*
    Output
    startingBlock: 0
    currentBlock: 707
    highestBlock:707
  */

  // system.version
  const version = await sdk.client.api.rpc.system.version()
  console.log("version")
  console.log("Version: " + version.toString())
  /*
    Output
    Version: 2.2.1-4f0439f4448
  */

  // kate.blockLength
  const tx = sdk.tx.dataAvailability.submitData("My Data")
  const res = await tx.executeWaitForFinalization(Account.alice(), { app_id: 5 })
  const [txIndex, blockHash] = [res.txIndex, res.blockHash]

  const blockLength = await (sdk.client.api.rpc as any).kate.blockLength(blockHash.toHex())
  console.log("blockLength")
  console.log("Normal: " + blockLength.max.normal.toNumber())
  console.log("Operational: " + blockLength.max.operational.toNumber())
  console.log("Mandatory:" + blockLength.max.mandatory.toNumber())
  console.log("Cols: " + blockLength.cols.toNumber())
  console.log("Rows: " + blockLength.rows.toNumber())
  console.log("ChunkSize: " + blockLength.chunkSize.toNumber())
  /*
    Output
    Normal: 2097152
    Operational: 2097152
    Mandatory: 2097152
    Cols: 256
    Rows: 256
    ChunkSize: 32
  */

  // kate.queryDataProof
  const dataProof = await (sdk.client.api.rpc as any).kate.queryDataProof(txIndex, blockHash.toHex())
  console.log("queryDataProof")
  console.log("DataRoot: " + dataProof.dataProof.roots.dataRoot.toString())
  console.log("BlobRoot: " + dataProof.dataProof.roots.blobRoot.toString())
  console.log("BridgeRoot: " + dataProof.dataProof.roots.bridgeRoot.toString())
  dataProof.dataProof.proof.forEach((e: any) => console.log(e))
  console.log("NumberOfLeaves: " + dataProof.dataProof.numberOfLeaves.toNumber())
  console.log("LeafIndex: " + dataProof.dataProof.leafIndex.toNumber())
  console.log("Leaf: " + dataProof.dataProof.leaf.toString())
  console.log("Message: " + dataProof.message.toString())
  /*
    Output
    DataRoot: 0xd6e516bbf0b0d964a6a6a41a18c58a2eac4757001c2338a8601c4cc961332fda
    BlobRoot: 0x29c73490baca9fe2b11095a69294de4b4a86bcb3a2eb3cd04b51dfdd0b4030f9
    BridgeRoot: 0x0000000000000000000000000000000000000000000000000000000000000000
    NumberOfLeaves: 1
    LeafIndex: 0
    Leaf: 0x47a59a7805e0bfe350ee0395d426c15770edc03fee72aa6532b5bbcffaf28030
    Message: 
  */

  // kate.queryProof
  const cell = [[0, 0]]
  const proof = await (sdk.client.api.rpc as any).kate.queryProof(cell, blockHash.toHex())
  console.log("proof")
  proof.forEach((e: any) => e.forEach((g: any) => console.log(g.toString())))
  /*
    Output
    2178534751726990040338027377623275511556638494274780568875624948149315822336
    0xb7be11461735c1c52a96c3319def842092b51b54142d1e7e6f307cade9b3966897e8b8499e1c2fe9f3213c337560e5bb
  */

  // kate.queryRows
  const rows = [0]
  const rowsResult = await (sdk.client.api.rpc as any).kate.queryRows(rows, blockHash.toHex())
  console.log("queryRows")
  rowsResult.forEach((e: any) => e.forEach((g: any) => console.log(g.toString())))
  /*
    Output
    2178534751726990040338027377623275511556638494274780568875624948149315822336
    69809044805081050561184934886915677873289200296740001199394424254799507156224
    4352252970560996938972626135851379325521790154040731149679347419805560005632
    104879959288272688727650528319334922080558860381160795517508406844350550507520
  */
}
