# Design Pillars

- HTTP as first class citizen
- Sensible error handling
- API that does one thing and does it correctly

## HTTP as first class citizen

Libraries like Polkadot JS API, SubXT and GSRPC use and build their interfaces
around websockets. Websockets are fine when work is done in a local network, but
the moment it is used on a real living network things get ugly really fast.
Nodes have a tendency to without any particular reason kill existing websocket
connections leaving the other end in non favorable position. The closing of the
connection can happen at any time, during storage querying, transaction
submission and the worst offender during transaction state watching.

Adding external retry mechanism could partially solve some of the problems, but
it would be like putting a bandaid on a broken leg. The only correct solution is
to move away from websockets and fully embrace HTTP as first class citizen. This
proved to be a bigger challenge than anticipated as some of the functionality
that is needed is only available through websocket only RPC calls. Because of
that new RPCs where added that were HTTP friendly and where doing the same
operation in the same or slightly better way. Another bonus is that this new
RPCs can now be easily tested through the CLI, Postman or any other tool as no
websocket connection is required to be established.

## Sensible error handling

Control flow, error and/or exception handling, error codes. A nightmare for
every developer since the age od dinosaur to figure out what would be the best
approach to use for their own project. Holy wars were fought of this topic, many
[StackOverflow](https://stackoverflow.com/questions/1388335/exception-vs-error-code-vs-assert)
questions were filled with people fighting tooth and nail to prove that their
approach is the most "enlightened" one. For our case a hybrid approach between
returning an error and throwing an exception is utilized.

### Error only interface

Most interfaces will (almost) always never thrown an exception and instead will
communicate with the caller that something is wrong by explicitly returning an
error. This forces the caller to check if an error has happened and to bubble
the error up by returning it, handling it, or by throwing it and hoping for the
best.

```ts
// Transaction Submission
const submittedTx: ClientError | SubmittedTransaction = await submittableTx.signAndSubmit(signer, { app_id: 2 })
// signAndSubmit might fail if were we unable to send our transaction so we must handle this case
if (submittedTx instanceof ClientError) throw submittedTx
console.log(`Success. Tx Hash: ${submittedTx.txHash}`)
```

### Dual interface: One for errors and and for exceptions

Some interfaces are split into safe and unsafe parts. The safe part works the
same as the unsafe one with the exception that the safe method will return an
error if something goes wrong and the unsafe one will throw an exception.

```ts
const encodedData = "0xQWERTY"

// The decode method is safe to use and it will return an error if it fails to decode.
const data: ClientError | Uint8Array = Hex.decode(encodedData)
// oops, something went wrong
if (data instanceof ClientError) throw data

// On the other hand there is a method with a similar name that will thrown an exception
// if it fails instead of returning an error.
const data: Uint8Array = Hex.decodeUnsafe(encodedData)
```

### One interface that is and is not safe

In the minority are interfaces that for some inputs are safe but for some other
inputs will gladly thrown an exception. These interfaces are the prime targets
to be changed to something more sensible.

```ts
// If a string is passed it might trow an exception if the account address is not a valid one
const accountId: AccountId = AccountId.from("0xQWERTY")

// If a keyring object is passed it will never throw an exception
const accountId: AccountId = AccountId.from(KeyringPair obj)
```

## API that does one thing and does it correctly

To keep it short, priority was given to making sure that interfaces do one thing
and one thing only. This makes the whole API easier to read and easier to reason
with. This does not mean that there are no compound functions or methods
available to be called. Some of them (as showcased in the next example) are
still simple enough to understand and either do one or two additional operations
that the caller would do anyhow. All compound functions can, if necessary, be
totally ignored as these functions do nothing special besides calling existing
already available interfaces.

```ts
// Transaction Creation
const submittableTx = client.tx.dataAvailability.submitData("abc");

// Transaction Submission. If an error is returned it means that we failed to submit our transaction.
// This means that it is safe to submit the same transaction again.
const submittedTx: ClientError | ... = await submittableTx.signAndSubmit(signer, { app_id: 2 });

// Fetching Transaction Receipt. If an error is returned it means we failed to get a
// valid conclusion if a transaction has been included or not. If `null` is returned
// then we failed to find our transaction in next N (based upon mortality) blocks which
// means that it was dropped and it is safe to submit the same transaction again.
//
// This method can be called as many times as necessary as it does not produce any side effects.
const receipt: ClientError | null | ... = await submittedTx.receipt()

// Fetching Block State. Can be "Included" | "Finalized" |"Discarded" | "DoesNotExist"
//
// This method can be called as many times as necessary as it does not produce any side effects.
const blockState: ClientError | ... = await receipt.blockState();

// Fetching Transaction Events. This method is a prime example of a compound function.
// 1. It fetches transaction related events
// 2. If no transaction events are found it returns an error instead of null
//
// This simplifies the interface as the caller doesn't need to manually check for `null` value
// and at the same time it doesn't do anything controversial as fetching and getting no transaction related
// events is extremely rare. If necessary, the caller can skip this method and manually call the same
// methods as this method is calling.
//
// This method can be called as many times as necessary as it does not produce any side effects.
const events: ClientError | ... = await receipt.txEvents();

// Fetching the submitted transaction from the block. This method is another compound function.
// 1. It fetches the transaction from the block
// 2. If no transaction was found it returns an error instead of null
// 3. If we failed to decode the transaction then it returns an error
//
// Just like in the `txEvents()` case treating no transaction was found
// (or if we failed to decode the transaction) as an error saves the caller to manually
// check for it. If necessary, the caller can skip this method and manually call the same
// methods as this method is calling.
//
// This method can be called as many times as necessary as it does not produce any side effects.
const tx: ClientError | ... = await receipt.tx(avail.dataAvailability.tx.SubmitData)
```
