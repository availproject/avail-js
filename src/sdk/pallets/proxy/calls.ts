import { Transaction } from "../../transaction"
import { Client, AccountId, H256 } from "../../."
import { SubmittableExtrinsic } from "@polkadot/api/types"

export type ProxyType = "Any" | "NonTransfer" | "Governance" | "Staking" | "IdentityJudgement" | "NominationPools" | number

export class Calls {
  constructor(private client: Client) { }

  // Dispatch the given `call` from an account that the sender is authorised for through
  // `add_proxy`.
  //
  // The dispatch origin for this call must be _Signed_.
  //
  // Parameters:
  // - `Real`: The account that the proxy will make a call on behalf of.
  // - `ForceProxyType`: Specify the exact proxy type to be used and checked for this call.
  // - `Call`: The call to be made by the `real` account.
  //
  // Checked
  proxy(real: string | AccountId, forceProxyType: ProxyType | null, call: SubmittableExtrinsic<"promise">): Transaction {
    const tx = this.client.api.tx.proxy.proxy(real.toString(), forceProxyType, call)
    return new Transaction(this.client, tx)
  }

  // Register a proxy account for the sender that is able to make calls on its behalf.
  //
  // The dispatch origin for this call must be _Signed_.
  //
  // Parameters:
  // - `Delegate`: The account that the `caller` would like to make a proxy.
  // - `ProxyType`: The permissions allowed for this proxy account.
  // - `Delay`: The announcement period required of the initial proxy. Will generally be
  // zero.
  //
  // Checked
  addProxy(delegate: string | AccountId, proxyType: ProxyType, delay: number): Transaction {
    const tx = this.client.api.tx.proxy.addProxy(delegate.toString(), proxyType, delay)
    return new Transaction(this.client, tx)
  }

  //
  // The dispatch origin for this call must be _Signed_.
  //
  // Parameters:
  // - `Delegate`: The account that the `caller` would like to remove as a proxy.
  // - `ProxyType`: The permissions currently enabled for the removed proxy account.
  // - `Delay`:  Will generally be zero.
  //
  // Checked
  removeProxy(delegate: string | AccountId, proxyType: ProxyType, delay: number): Transaction {
    const tx = this.client.api.tx.proxy.removeProxy(delegate.toString(), proxyType, delay)
    return new Transaction(this.client, tx)
  }

  // Unregister all proxy accounts for the sender.
  //
  // The dispatch origin for this call must be _Signed_.
  //
  // WARNING: This may be called on accounts created by `pure`, however if done, then
  // the unreserved fees will be inaccessible. **All access to this account will be lost.**
  removeProxies(): Transaction {
    const tx = this.client.api.tx.proxy.removeProxies()
    return new Transaction(this.client, tx)
  }

  // Spawn a fresh new account that is guaranteed to be otherwise inaccessible, and
  // initialize it with a proxy of `proxy_type` for `origin` sender.
  //
  // Requires a `Signed` origin.
  //
  // - `ProxyType`: The type of the proxy that the sender will be registered as over the
  // new account. This will almost always be the most permissive `ProxyType` possible to
  // allow for maximum flexibility.
  // - `Index`: A disambiguation index, in case this is called multiple times in the same
  // transaction (e.g. with `utility::batch`). Unless you're using `batch` you probably just
  // want to use `0`.
  // - `Delay`: The announcement period required of the initial proxy. Will generally be
  // zero.
  //
  // Fails with `Duplicate` if this has already been called in this transaction, from the
  // same sender, with the same parameters.
  //
  // Fails if there are insufficient funds to pay for deposit.
  //
  // Checked
  createPure(proxyType: ProxyType, delay: number, index: number): Transaction {
    const tx = this.client.api.tx.proxy.createPure(proxyType, delay, index)
    return new Transaction(this.client, tx)
  }


  // Publish the hash of a proxy-call that will be made in the future.
  //
  // This must be called some number of blocks before the corresponding `proxy` is attempted
  // if the delay associated with the proxy relationship is greater than zero.
  //
  // No more than `MaxPending` announcements may be made at any one time.
  //
  // This will take a deposit of `AnnouncementDepositFactor` as well as
  // `AnnouncementDepositBase` if there are no other pending announcements.
  //
  // The dispatch origin for this call must be _Signed_ and a proxy of `real`.
  //
  // Parameters:
  // - `Real`: The account that the proxy will make a call on behalf of.
  // - `CallHash`: The hash of the call to be made by the `real` account.
  announce(real: string | AccountId, callHash: string | H256): Transaction {
    const tx = this.client.api.tx.proxy.announce(real.toString(), callHash.toString())
    return new Transaction(this.client, tx)
  }

  // Remove a given announcement.
  //
  // May be called by a proxy account to remove a call they previously announced and return
  // the deposit.
  //
  // The dispatch origin for this call must be _Signed_.
  //
  // Parameters:
  // - `Real`: The account that the proxy will make a call on behalf of.
  // - `CallHash`: The hash of the call to be made by the `real` account.
  removeAnnouncement(real: string | AccountId, callHash: string | H256): Transaction {
    const tx = this.client.api.tx.proxy.removeAnnouncement(real.toString(), callHash.toString())
    return new Transaction(this.client, tx)
  }

  // Remove the given announcement of a delegate.
  //
  // May be called by a target (proxied) account to remove a call that one of their delegates
  // (`delegate`) has announced they want to execute. The deposit is returned.
  //
  // The dispatch origin for this call must be _Signed_.
  //
  // Parameters:
  // - `Delegate`: The account that previously announced the call.
  // - `CallHash`: The hash of the call to be made.
  rejectAnnouncement(delegate: string | AccountId, callHash: string | H256): Transaction {
    const tx = this.client.api.tx.proxy.rejectAnnouncement(delegate.toString(), callHash.toString())
    return new Transaction(this.client, tx)
  }

  // Dispatch the given `call` from an account that the sender is authorized for through
  // `add_proxy`.
  //
  // Removes any corresponding announcement(s).
  //
  // The dispatch origin for this call must be _Signed_.
  //
  // Parameters:
  // - `Real`: The account that the proxy will make a call on behalf of.
  // - `ForceProxyType`: Specify the exact proxy type to be used and checked for this call.
  // - `Call`: The call to be made by the `real` account.
  proxyAnnounced(delegate: string | AccountId, real: string | AccountId, forceProxyType: ProxyType | null, call: SubmittableExtrinsic<"promise">): Transaction {
    const tx = this.client.api.tx.proxy.proxyAnnounced(delegate.toString(), real.toString(), forceProxyType, call)
    return new Transaction(this.client, tx)
  }
}
