# Avail JS SDK

[![npm stable](https://img.shields.io/npm/v/avail-js-sdk?logo=npm&style=flat-square)](https://www.npmjs.com/package/avail-js-sdk)

TypeScript/JavaScript SDK for interacting with Avail networks.

## Install

```bash
npm install avail-js-sdk
```

## Quick Start

```ts
import { BlockQueryMode, Client, Options } from "avail-js-sdk"
import { Keyring } from "@polkadot/keyring"

async function main() {
  const client = await Client.connect("https://turing-rpc.avail.so/rpc", {
    transport: "http",
  })

  const keyring = new Keyring({ type: "sr25519" })
  const signer = keyring.addFromUri("//Alice")

  const tx = client.tx().dataAvailability().submitData(2, "hello")
  const submitted = await tx.submitSigned(signer, Options.new())
  const receipt = await submitted.waitForReceipt(BlockQueryMode.Finalized)

  console.log(receipt.blockHeight)
}

main().catch(console.error)
```

## Main Surfaces

- `src/client`: client lifecycle and connection options.
- `src/chain`: chain/head RPC and query helpers.
- `src/block`: block-scoped event/extrinsic helpers.
- `src/submission`: signing, submission, receipts, outcomes.
- `src/subscription`: polling subscriptions for blocks/events/extrinsics.
- `src/transaction`: pallet-oriented transaction builders.
- `src/core`: low-level API wrapper, metadata, RPC and utilities.

## Docs and Examples

- Examples: https://availproject.github.io/avail-js/
- API reference: https://docs.availproject.org/api-reference/avail-node-api
- Repository: https://github.com/availproject/avail-js

## Error Reporting

Please open an issue with reproduction details:
https://github.com/availproject/avail-js/issues/new/choose

## License

MIT. See `LICENSE`.
