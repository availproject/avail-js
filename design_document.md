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
const submittedTx: AvailError | SubmittedTransaction = await submittableTx.signAndSubmit(signer, { app_id: 2 })
// signAndSubmit might fail if were we unable to send our transaction so we must handle this case
if (submittedTx instanceof AvailError) throw submittedTx
console.log(`Success. Tx Hash: ${submittedTx.txHash}`)
```

### Dual interface: One for errors and and for exceptions

Some interfaces are split into safe and unsafe parts. The safe part works the
same as the unsafe one with the exception that the safe method will return an
error if something goes wrong and the unsafe one will throw an exception.

```ts
const encodedData = "0xQWERTY"

// The decode method is safe to use and it will return an error if it fails to decode.
const data: AvailError | Uint8Array = Hex.decode(encodedData)
// oops, something went wrong
if (data instanceof AvailError) throw data

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
about. This does not mean that there are no compound functions or methods
available to be called. Some of them (as showcased in the next example) are
still simple enough to understand and either do one or two additional operations
that the caller would do anyhow. All compound functions can, if necessary, be
totally ignored as these functions do nothing special besides calling existing
already available interfaces.

```ts
// Transaction Creation
const submittableTx = client.tx().dataAvailability().submitData("abc");

// Transaction Submission. If an error is returned it means that we failed to submit our transaction.
// This means that it is safe to submit the same transaction again.
const submittedTx: AvailError | ... = await submittableTx.signAndSubmit(signer, { app_id: 2 });

// Fetching Transaction Receipt. If an error is returned it means we failed to get a
// valid conclusion if a transaction has been included or not. If `null` is returned
// then we failed to find our transaction in next N (based upon mortality) blocks which
// means that it was dropped and it is safe to submit the same transaction again.
//
// This method can be called as many times as necessary as it does not produce any side effects.
const receipt: AvailError | null | ... = await submittedTx.receipt()

// Fetching Block State. Can be "Included" | "Finalized" |"Discarded" | "DoesNotExist"
//
// This method can be called as many times as necessary as it does not produce any side effects.
const blockState: AvailError | ... = await receipt.blockState();

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
const events: AvailError | ... = await receipt.txEvents();

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
const tx: AvailError | ... = await receipt.tx(avail.dataAvailability.tx.SubmitData)
```

# To Retry, or Not to Retry, That is the Question: Local Opt-out Retries

Whenever communication over network is required there are chances our message to
the recipient will not be deliver or the recipient is down so no messages can
flow there. At the same time, the recipient can successfully receive the message
and reply back with data that is malformed. Thus, there are two approaches that
can be taken:

- Not implementing retires on the library level and leave it up to the library
  user to do it
- Or implement it on the library level

## Leaving it up to the user

Not having any kind of retry mechanism implemented in the library itself has
some benefits. The library is easier to reason about, the control flow is simple
and there are no hidden surprises. In systems where errors happen rarely this
approach might have merit, but in our case where errors are more than common the
library user will most if not all the time have to implement some kind of retry
mechanism.

Because of that, not providing a retry mechanism on the library level would be
seen as a features that is missing. Speaking from a "correctness" perspective it
is safe to assume that the general consensus would be that an average user would
expect that the library provides it. For example, SubXT provides an RPC that
tries to reconnect if a websocket connection is terminated or if an error
happens.

## Implementing it Inside the Library

We have established that a level of retry mechanism inside the library would be
beneficial for the end user. The question now is to what extended should it be
implemented in order to cover most of the needs of an average and power user.

### Always On vs Opt In vs Opt Out

Using an Always On approach means that the library user has no ability to
disable the retry mechanism on the library level. This beneficial as it
decreases code complexity on the library level thus making it easier to reason
about. The problem is implementing a retry mechanism that will be sufficiently
good for both the average and power user is virtually impossible. The power user
will want to have a greater control on what is going on and there will be cases
where even an average user would want to disable it and use a custom
implementation.

Using an Opt In approach solves some of the problems mentioned in the Always On
section. In this case the power user is satisfied to a degree as the library
level retry mechanism is not mandatory to be used, but the average use case
suffers greatly. This is because most of the times you don't want to implement
your own mechanism and with Opt In you will need to enable the retry mechanism
every single time when you will need it. This is error prone and not skilled
users (and other as well) might accidentally forgot to enable it.

Using an Opt Out approach is the preferred approach as it solves all the issues
that Always On and Opt In have. The retry mechanism is optional and can be
easily disabled if necessary. Low skilled and average users don't need think too
much when using the library as from their perspective it will "just work" and
power users can opt out in places where they deem that the existing
implementation is not acceptable.

### Global vs Local

#### Global

Global based retry mechanism allows the user to enable it in one single place
and then this setting is applied to all library interfaces and action. The
advantage is that no changes are needed on the interface definition level, but
it is actually harder to reason about. The reason for that is because it's
impossible from the library user's perspective to know if a interface will or
will not retry in case of an error.

Besides that drawback, there are some other drawbacks as well that are even more
severe. As this is a global setting, you can end up with functions and methods
that duplicate, triplicate or even quadruplicate the retires as they have no
idea if the functions and methods they are calling have it implemented or not.
The library user might want to disable the retry mechanism for one single
operation, but if that operation is long lasting then you just cannot flip the
switch back as it will affect both the long lasting operation and next following
code.

#### Local

Instead of enabling or disabling the retry mechanism on a global level, this is
done on a per interface basis. Every interface has additional parameters that
define if retires should be executed or not. This allows for a more fine grained
and flexible approach. If a interface implements retires it will expose it as
the last parameter in the function header and it will have a default value so
that the user doesn't need to do anything unless the default value is not
acceptable.

The drawback is that completely disabling the retry mechanism on the library
level means writing more code as the default behavior is the retry mechanism to
be enabled. This could be mitigated if a global setting is provided to
completely disable it, but an investigation is needed in order to find out if
this is something that would be used by our target audiences.

### Configurable or Not

There can be cases where even more control is needed on how the existing retry
mechanism works. A user might want to increase the number of retires, or to
space them even more or to be able to use a custom algorithm for it. This is
something that would be interesting to research and could provide additional
value to the user. As of right now, the mechanism is rigid and can only be
either enabled or disabled. In total 5 retires and executed and are spaced as
following `[1s, 2s, 3s, 5s, 8s]` where it will wait 1 second before doing the
first retry and at the end it will wait 8 second before doing the last retry.

Defining a good default backoff strategy isn't a trivial task so additional
investigation is needed. Resources:
[Thuc notes: Retry Strategies and Patterns](https://buildsoftwaresystems.com/post/software_robustness_and_timeout_retry_backoff/)
[Build Software Systems: Software Robustness and Timeout Retry Backoff Paradigms](https://thuc.space/posts/retry_strategies/)
