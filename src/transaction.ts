import type { Client } from "./client"
import { avail } from "./core"
import { AvailError } from "./core/error"
import type { BN } from "./core/polkadot"
import { AccountId, H256, MultiAddress, type MultiAddressValue, type Weight } from "./core/metadata"
import { hexDecode } from "./core/utils"
import type { ExtrinsicLike } from "./submission/submittable"
import { encodeTransactionCallLike, SubmittableTransaction } from "./submission/submittable"

/**
 * Main transaction builder class for creating and submitting Avail blockchain transactions.
 *
 * @remarks
 * The Transaction class provides access to all transaction types available on the Avail blockchain,
 * organized by pallet (module). Each method returns a specialized builder for a specific pallet's
 * transaction types.
 *
 * @example
 * ```ts
 * import { Keyring } from "@polkadot/keyring";
 *
 * const client = await Client.create("ws://127.0.0.1:9944");
 * if (!(client instanceof AvailError)) {
 *   const keyring = new Keyring({ type: "sr25519" });
 *   const alice = keyring.addFromUri("//Alice");
 *
 *   // Submit data to the blockchain
 *   const tx = client.tx().dataAvailability().submitData("Hello Avail!");
 *   const result = await tx.signAndSend(alice);
 * }
 * ```
 *
 * @public
 */
export class Transaction {
  constructor(private client: Client) {}

  /**
   * Returns a builder for Data Availability pallet transactions.
   *
   * @returns A DataAvailability instance for creating application keys and submitting data.
   *
   * @example
   * ```ts
   * const tx = client.tx().dataAvailability().submitData("My data");
   * ```
   *
   * @public
   */
  dataAvailability(): DataAvailability {
    return new DataAvailability(this.client)
  }

  /**
   * Returns a builder for Balances pallet transactions.
   *
   * @returns A Balances instance for transferring tokens between accounts.
   *
   * @example
   * ```ts
   * const tx = client.tx().balances().transferKeepAlive(dest, amount);
   * ```
   *
   * @public
   */
  balances(): Balances {
    return new Balances(this.client)
  }

  /**
   * Returns a builder for Utility pallet transactions.
   *
   * @returns A Utility instance for batch operations and other utility functions.
   *
   * @example
   * ```ts
   * const tx = client.tx().utility().batchAll([call1, call2]);
   * ```
   *
   * @public
   */
  utility(): Utility {
    return new Utility(this.client)
  }

  /**
   * Returns a builder for Multisig pallet transactions.
   *
   * @returns A Multisig instance for multi-signature operations.
   *
   * @example
   * ```ts
   * const tx = client.tx().multisig().asMulti(threshold, signatories, timepoint, call, weight);
   * ```
   *
   * @public
   */
  multisig(): Multisig {
    return new Multisig(this.client)
  }

  /**
   * Returns a builder for Proxy pallet transactions.
   *
   * @returns A Proxy instance for managing proxy accounts.
   *
   * @example
   * ```ts
   * const tx = client.tx().proxy().addProxy(delegate, proxyType, delay);
   * ```
   *
   * @public
   */
  proxy(): Proxy {
    return new Proxy(this.client)
  }

  /**
   * Returns a builder for Staking pallet transactions.
   *
   * @returns A Staking instance for staking operations like bonding and nominating.
   *
   * @example
   * ```ts
   * const tx = client.tx().staking().bond(amount, rewardDestination);
   * ```
   *
   * @public
   */
  staking(): Staking {
    return new Staking(this.client)
  }

  /**
   * Returns a builder for Identity pallet transactions.
   *
   * @returns An Identity instance for managing on-chain identities.
   *
   * @example
   * ```ts
   * const tx = client.tx().identity().setIdentity(info);
   * ```
   *
   * @public
   */
  identity(): Identity {
    return new Identity(this.client)
  }

  /**
   * Returns a builder for Nomination Pools pallet transactions.
   *
   * @returns A NominationPools instance for nomination pool operations.
   *
   * @example
   * ```ts
   * const tx = client.tx().nominationPools().join(amount, poolId);
   * ```
   *
   * @public
   */
  nominationPools(): NominationPools {
    return new NominationPools(this.client)
  }

  /**
   * Returns a builder for Sudo pallet transactions.
   *
   * @returns A Sudo instance for privileged operations (requires sudo access).
   *
   * @example
   * ```ts
   * const tx = client.tx().sudo().sudo(call);
   * ```
   *
   * @public
   */
  sudo(): Sudo {
    return new Sudo(this.client)
  }

  /**
   * Returns a builder for Session pallet transactions.
   *
   * @returns A Session instance for session key management.
   *
   * @example
   * ```ts
   * const tx = client.tx().session().setKeys(babe, grandpa, authority, imOnline, proof);
   * ```
   *
   * @public
   */
  session(): Session {
    return new Session(this.client)
  }
}

/**
 * Builder for Session pallet transactions.
 *
 * @remarks
 * The Session pallet manages session keys for validators, which are used for
 * block production and other consensus-related operations.
 *
 * @public
 */
export class Session {
  constructor(private client: Client) {}

  /**
   * Sets new session keys for a validator.
   *
   * @param babe - The BABE session key (block production).
   * @param grandpa - The GRANDPA session key (finality).
   * @param authorityDiscovery - The authority discovery session key.
   * @param imOnline - The ImOnline session key (liveness indication).
   * @param proof - Optional proof bytes for key ownership. Pass null or empty array if not required.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @throws {AvailError} If the proof string cannot be hex-decoded.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const validator = keyring.addFromUri("//Validator");
   *
   * const tx = client.tx().session().setKeys(
   *   "0x1234...", // BABE key
   *   "0x5678...", // GRANDPA key
   *   "0x9abc...", // Authority discovery key
   *   "0xdef0...", // ImOnline key
   *   null // No proof
   * );
   * await tx.signAndSend(validator);
   * ```
   *
   * @public
   */
  setKeys(
    babe: H256 | Uint8Array | string,
    grandpa: H256 | Uint8Array | string,
    authorityDiscovery: H256 | Uint8Array | string,
    imOnline: H256 | Uint8Array | string,
    proof: Uint8Array | string | null,
  ): SubmittableTransaction {
    if (typeof proof == "string") {
      const p = hexDecode(proof)
      if (p instanceof AvailError) throw p
      proof = p
    }
    if (proof == null) {
      proof = new Uint8Array()
    }

    const call = new avail.session.tx.SetKeys(
      H256.from(babe, true),
      H256.from(grandpa, true),
      H256.from(authorityDiscovery, true),
      H256.from(imOnline, true),
      proof,
    )
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Removes all session keys for the caller.
   *
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This is typically used when a validator is being decommissioned or needs to
   * rotate their session keys completely.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const validator = keyring.addFromUri("//Validator");
   *
   * const tx = client.tx().session().purgeKeys();
   * await tx.signAndSend(validator);
   * ```
   *
   * @public
   */
  purgeKeys(): SubmittableTransaction {
    const call = new avail.session.tx.PurgeKeys()
    return SubmittableTransaction.from(this.client, call)
  }
}

/**
 * Builder for Nomination Pools pallet transactions.
 *
 * @remarks
 * The Nomination Pools pallet enables users to pool their tokens together for staking purposes,
 * allowing smaller stakeholders to participate in nomination without meeting the minimum validator
 * bond requirements. Pools have designated roles (root, nominator, bouncer) that manage various
 * aspects of pool operation including nominations, membership, and commission.
 *
 * @public
 */
export class NominationPools {
  constructor(private client: Client) {}

  /**
   * Bonds additional tokens from the caller to their existing pool membership.
   *
   * @param value - The bonding value specification (either "FreeBalance" to bond all free balance, or { Rewards: amount } to bond from pending rewards).
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This allows existing pool members to increase their stake in the pool by bonding additional
   * tokens. The tokens can come from the account's free balance or from unclaimed rewards.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const member = keyring.addFromUri("//Bob");
   *
   * // Bond all free balance
   * const tx1 = client.tx().nominationPools().bondExtra("FreeBalance");
   * await tx1.signAndSend(member);
   *
   * // Bond from rewards
   * const tx2 = client.tx().nominationPools().bondExtra({ Rewards: new BN(1000) });
   * await tx2.signAndSend(member);
   * ```
   *
   * @public
   */
  bondExtra(value: avail.nominationPools.types.BondExtraValue): SubmittableTransaction {
    const call = new avail.nominationPools.tx.BondExtra(value)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Bonds additional tokens for another pool member.
   *
   * @param member - The account address of the pool member to bond extra tokens for.
   * @param value - The bonding value specification (either "FreeBalance" to bond all free balance, or { Rewards: amount } to bond from pending rewards).
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This allows bonding extra tokens on behalf of another pool member, useful for pool operators
   * or automated systems managing pool memberships.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const operator = keyring.addFromUri("//Alice");
   *
   * const memberAddress = "5FHneW46...";
   * const tx = client.tx().nominationPools().bondExtraOther(memberAddress, { Rewards: new BN(5000) });
   * await tx.signAndSend(operator);
   * ```
   *
   * @public
   */
  bondExtraOther(
    member: MultiAddressValue | AccountId | string,
    value: avail.nominationPools.types.BondExtraValue,
  ): SubmittableTransaction {
    const call = new avail.nominationPools.tx.BondExtraOther(MultiAddress.from(member), value)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Stops a nomination pool from actively nominating validators.
   *
   * @param poolId - The ID of the pool to chill.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This removes the pool from the active nomination set, preventing it from earning staking rewards
   * until it nominates validators again. Only the pool's nominator role can execute this.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const nominator = keyring.addFromUri("//PoolNominator");
   *
   * const tx = client.tx().nominationPools().chill(1);
   * await tx.signAndSend(nominator);
   * ```
   *
   * @public
   */
  chill(poolId: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.Chill(poolId)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Claims accumulated commission for a nomination pool.
   *
   * @param poolId - The ID of the pool to claim commission from.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This transfers the accumulated commission from the pool to the designated commission payee account.
   * Commission must be configured for the pool using setCommission before it can be claimed.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const poolRoot = keyring.addFromUri("//PoolRoot");
   *
   * const tx = client.tx().nominationPools().claimCommission(1);
   * await tx.signAndSend(poolRoot);
   * ```
   *
   * @public
   */
  claimCommission(poolId: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.ClaimCommission(poolId)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Claims pending staking rewards for the caller's pool membership.
   *
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This transfers accumulated staking rewards from the pool to the caller's account.
   * The rewards are based on the member's proportional stake in the pool.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const member = keyring.addFromUri("//Bob");
   *
   * const tx = client.tx().nominationPools().claimPayout();
   * await tx.signAndSend(member);
   * ```
   *
   * @public
   */
  claimPayout(): SubmittableTransaction {
    const call = new avail.nominationPools.tx.ClaimPayout()
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Claims pending staking rewards for another pool member.
   *
   * @param owner - The account address of the pool member to claim rewards for.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This allows claiming rewards on behalf of another pool member, useful for automated
   * reward distribution systems or pool operators managing member rewards.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const operator = keyring.addFromUri("//Alice");
   *
   * const memberAddress = "5FHneW46...";
   * const tx = client.tx().nominationPools().claimPayoutOther(memberAddress);
   * await tx.signAndSend(operator);
   * ```
   *
   * @public
   */
  claimPayoutOther(owner: AccountId | string): SubmittableTransaction {
    const call = new avail.nominationPools.tx.ClaimPayoutOther(AccountId.from(owner, true))
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Creates a new nomination pool with automatically assigned pool ID.
   *
   * @param amount - The initial amount to bond to the pool in the smallest unit (plancks).
   * @param root - The account address that will have root privileges for the pool.
   * @param nominator - The account address that will have nominator privileges for the pool.
   * @param bouncer - The account address that will have bouncer privileges for the pool.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * Creates a new nomination pool with the caller as the initial member. The pool ID is
   * automatically assigned by the system. Pool roles include: root (manages pool settings),
   * nominator (selects validators), and bouncer (manages member permissions).
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const creator = keyring.addFromUri("//Alice");
   *
   * const amount = new BN("1000000000000000000"); // 1 AVAIL
   * const tx = client.tx().nominationPools().create(
   *   amount,
   *   "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // root
   *   "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", // nominator
   *   "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"  // bouncer
   * );
   * await tx.signAndSend(creator);
   * ```
   *
   * @public
   */
  create(
    amount: BN,
    root: AccountId | string | MultiAddressValue,
    nominator: AccountId | string | MultiAddressValue,
    bouncer: AccountId | string | MultiAddressValue,
  ): SubmittableTransaction {
    const call = new avail.nominationPools.tx.Create(
      amount,
      MultiAddress.from(root),
      MultiAddress.from(nominator),
      MultiAddress.from(bouncer),
    )
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Creates a new nomination pool with a specific pool ID.
   *
   * @param amount - The initial amount to bond to the pool in the smallest unit (plancks).
   * @param root - The account address that will have root privileges for the pool.
   * @param nominator - The account address that will have nominator privileges for the pool.
   * @param bouncer - The account address that will have bouncer privileges for the pool.
   * @param poolId - The specific pool ID to assign to this pool.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * Creates a new nomination pool with a specified pool ID instead of an automatically assigned one.
   * This is useful when you need to create pools with predictable or sequential IDs.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const creator = keyring.addFromUri("//Alice");
   *
   * const amount = new BN("1000000000000000000"); // 1 AVAIL
   * const tx = client.tx().nominationPools().createWithPoolId(
   *   amount,
   *   "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // root
   *   "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", // nominator
   *   "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy", // bouncer
   *   42 // specific pool ID
   * );
   * await tx.signAndSend(creator);
   * ```
   *
   * @public
   */
  createWithPoolId(
    amount: BN,
    root: AccountId | string | MultiAddressValue,
    nominator: AccountId | string | MultiAddressValue,
    bouncer: AccountId | string | MultiAddressValue,
    poolId: number,
  ): SubmittableTransaction {
    const call = new avail.nominationPools.tx.CreateWithPoolId(
      amount,
      MultiAddress.from(root),
      MultiAddress.from(nominator),
      MultiAddress.from(bouncer),
      poolId,
    )
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Joins an existing nomination pool as a new member.
   *
   * @param amount - The amount to bond to the pool in the smallest unit (plancks).
   * @param poolId - The ID of the pool to join.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This bonds the specified amount to the pool, making the caller a member of the pool.
   * Members earn staking rewards proportional to their stake in the pool.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const member = keyring.addFromUri("//Bob");
   *
   * const amount = new BN("500000000000000000"); // 0.5 AVAIL
   * const tx = client.tx().nominationPools().join(amount, 1);
   * await tx.signAndSend(member);
   * ```
   *
   * @public
   */
  join(amount: BN, poolId: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.Join(amount, poolId)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Nominates validators for a nomination pool to support.
   *
   * @param poolId - The ID of the pool to set nominations for.
   * @param validators - Array of validator account addresses to nominate.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This sets the list of validators that the pool will nominate with its bonded stake.
   * Only the pool's nominator role can execute this transaction. The pool must be in the
   * active state to earn rewards.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const nominator = keyring.addFromUri("//PoolNominator");
   *
   * const validators = [
   *   "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
   *   "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
   *   "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"
   * ];
   * const tx = client.tx().nominationPools().nominate(1, validators);
   * await tx.signAndSend(nominator);
   * ```
   *
   * @public
   */
  nominate(poolId: number, validators: (AccountId | string)[]): SubmittableTransaction {
    const v: AccountId[] = validators.map((x) => AccountId.from(x, true))
    const call = new avail.nominationPools.tx.Nominate(poolId, v)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Sets the claim permission for the caller's pool membership rewards.
   *
   * @param permission - The claim permission setting ("Permissioned", "PermissionlessCompound", "PermissionlessWithdraw", or "PermissionlessAll").
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This controls who can claim rewards on behalf of the member. "Permissioned" means only
   * the member can claim, while "Permissionless*" options allow others to claim or compound
   * rewards on the member's behalf.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const member = keyring.addFromUri("//Bob");
   *
   * // Allow anyone to claim and compound rewards on behalf of this member
   * const tx = client.tx().nominationPools().setClaimPermission("PermissionlessAll");
   * await tx.signAndSend(member);
   * ```
   *
   * @public
   */
  setClaimPermission(permission: avail.nominationPools.types.ClaimPermissionValue): SubmittableTransaction {
    const call = new avail.nominationPools.tx.SetClaimPermission(permission)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Sets the commission rate and payee for a nomination pool.
   *
   * @param poolId - The ID of the pool to set commission for.
   * @param newCommission - A tuple of [commission rate (in perbill), payee account address], or null to remove commission.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * Commission is charged on pool rewards before distribution to members. The rate is specified
   * in perbill (parts per billion), where 1,000,000,000 equals 100%. Only the pool's root can
   * execute this transaction.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const poolRoot = keyring.addFromUri("//PoolRoot");
   *
   * // Set 5% commission (50,000,000 perbill = 5%)
   * const tx1 = client.tx().nominationPools().setCommission(1, [50000000, "5GrwvaEF5zXb26..."]);
   * await tx1.signAndSend(poolRoot);
   *
   * // Remove commission
   * const tx2 = client.tx().nominationPools().setCommission(1, null);
   * await tx2.signAndSend(poolRoot);
   * ```
   *
   * @public
   */
  setCommission(poolId: number, newCommission: [number, AccountId | string] | null): SubmittableTransaction {
    const nc: [number, AccountId] | null = newCommission
      ? [newCommission[0], AccountId.from(newCommission[1], true)]
      : null
    const call = new avail.nominationPools.tx.SetCommission(poolId, nc)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Sets the commission change rate limits for a nomination pool.
   *
   * @param poolId - The ID of the pool to configure commission change rate for.
   * @param maxIncrease - The maximum commission increase allowed per change (in perbill).
   * @param minDelay - The minimum number of blocks required between commission changes.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This establishes guardrails for how quickly and by how much the pool commission can be changed,
   * protecting members from sudden commission increases. Only the pool's root can execute this.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const poolRoot = keyring.addFromUri("//PoolRoot");
   *
   * // Allow max 1% increase per change, with 7 days between changes (assuming 6s blocks)
   * const maxIncrease = 10000000; // 1% in perbill
   * const minDelay = 100800; // ~7 days in blocks
   * const tx = client.tx().nominationPools().setCommissionChangeRate(1, maxIncrease, minDelay);
   * await tx.signAndSend(poolRoot);
   * ```
   *
   * @public
   */
  setCommissionChangeRate(poolId: number, maxIncrease: number, minDelay: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.SetCommissionChangeRate(poolId, maxIncrease, minDelay)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Sets the maximum commission rate that can be charged by a nomination pool.
   *
   * @param poolId - The ID of the pool to set the maximum commission for.
   * @param maxCommission - The maximum commission rate in perbill (parts per billion).
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This sets a hard cap on the commission rate that can be set for the pool, protecting
   * members from excessive commission charges. Only the pool's root can execute this transaction.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const poolRoot = keyring.addFromUri("//PoolRoot");
   *
   * // Set maximum commission to 10% (100,000,000 perbill = 10%)
   * const maxCommission = 100000000;
   * const tx = client.tx().nominationPools().setCommissionMax(1, maxCommission);
   * await tx.signAndSend(poolRoot);
   * ```
   *
   * @public
   */
  setCommissionMax(poolId: number, maxCommission: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.SetCommissionMax(poolId, maxCommission)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Sets the metadata for a nomination pool.
   *
   * @param poolId - The ID of the pool to set metadata for.
   * @param metadata - The metadata to set (string or raw bytes). Typically a pool name or description.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * Metadata is publicly visible information about the pool, such as its name, description,
   * or other identifying information. Only the pool's root can execute this transaction.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const poolRoot = keyring.addFromUri("//PoolRoot");
   *
   * const tx = client.tx().nominationPools().setMetadata(1, "Avail Community Pool");
   * await tx.signAndSend(poolRoot);
   * ```
   *
   * @public
   */
  setMetadata(poolId: number, metadata: string | Uint8Array): SubmittableTransaction {
    if (typeof metadata == "string") {
      metadata = new TextEncoder().encode(metadata)
    }
    const call = new avail.nominationPools.tx.SetMetadata(poolId, metadata)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Sets the operational state of a nomination pool.
   *
   * @param poolId - The ID of the pool to change state for.
   * @param state - The new pool state ("Open", "Blocked", or "Destroying").
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * Pool states control operations: "Open" allows all operations, "Blocked" prevents new members
   * from joining, and "Destroying" initiates pool shutdown. Only the pool's bouncer or root can
   * execute this transaction.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const bouncer = keyring.addFromUri("//Bouncer");
   *
   * // Block new members from joining
   * const tx1 = client.tx().nominationPools().setState(1, "Blocked");
   * await tx1.signAndSend(bouncer);
   *
   * // Reopen the pool
   * const tx2 = client.tx().nominationPools().setState(1, "Open");
   * await tx2.signAndSend(bouncer);
   * ```
   *
   * @public
   */
  setState(poolId: number, state: avail.nominationPools.types.PoolStateValue): SubmittableTransaction {
    const call = new avail.nominationPools.tx.SetState(poolId, state)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Unbonds tokens from a pool member's stake, initiating the unbonding period.
   *
   * @param memberAccount - The account address of the pool member to unbond tokens from.
   * @param unbondingPoints - The number of points (proportional to tokens) to unbond.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This starts the unbonding process for the specified amount. The tokens will be locked
   * for the unbonding period before they can be withdrawn using withdrawUnbonded. Members
   * can unbond their own tokens, or the pool's nominator/root can unbond for any member.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const member = keyring.addFromUri("//Bob");
   *
   * const unbondingPoints = new BN("100000000000000000"); // 0.1 AVAIL worth of points
   * const tx = client.tx().nominationPools().unbond(member.address, unbondingPoints);
   * await tx.signAndSend(member);
   * ```
   *
   * @public
   */
  unbond(memberAccount: MultiAddressValue | AccountId | string, unbondingPoints: BN): SubmittableTransaction {
    const call = new avail.nominationPools.tx.Unbond(MultiAddress.from(memberAccount), unbondingPoints)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Updates the role assignments for a nomination pool.
   *
   * @param poolId - The ID of the pool to update roles for.
   * @param newRoot - New root role assignment: "Noop" (no change), { Set: address } (assign to address), or "Remove" (clear role).
   * @param newNominator - New nominator role assignment: "Noop", { Set: address }, or "Remove".
   * @param newBouncer - New bouncer role assignment: "Noop", { Set: address }, or "Remove".
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This allows the pool's root to reassign or remove role accounts. The root manages pool settings,
   * the nominator selects validators, and the bouncer controls member permissions. Only the current
   * root can execute this transaction.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const currentRoot = keyring.addFromUri("//Alice");
   *
   * const tx = client.tx().nominationPools().updateRoles(
   *   1,
   *   { Set: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" }, // new root
   *   "Noop", // keep current nominator
   *   { Set: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty" }  // new bouncer
   * );
   * await tx.signAndSend(currentRoot);
   * ```
   *
   * @public
   */
  updateRoles(
    poolId: number,
    newRoot: "Noop" | { Set: AccountId | string } | "Remove",
    newNominator: "Noop" | { Set: AccountId | string } | "Remove",
    newBouncer: "Noop" | { Set: AccountId | string } | "Remove",
  ): SubmittableTransaction {
    let nr: "Noop" | "Remove" | { Set: AccountId } = "Noop"
    let nn: "Noop" | "Remove" | { Set: AccountId } = "Noop"
    let nb: "Noop" | "Remove" | { Set: AccountId } = "Noop"
    if (typeof newRoot != "string") {
      nr = { Set: AccountId.from(newRoot.Set, true) }
    } else {
      nr = newRoot
    }
    if (typeof newNominator != "string") {
      nn = { Set: AccountId.from(newNominator.Set, true) }
    } else {
      nn = newNominator
    }
    if (typeof newBouncer != "string") {
      nb = { Set: AccountId.from(newBouncer.Set, true) }
    } else {
      nb = newBouncer
    }
    const call = new avail.nominationPools.tx.UpdateRoles(poolId, nr, nn, nb)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Withdraws unbonded tokens after the unbonding period has elapsed.
   *
   * @param memberAccount - The account address of the pool member to withdraw unbonded tokens for.
   * @param numSlashingSpans - The number of slashing spans to process (use 0 if unsure, the call will fail and indicate the correct value).
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This completes the unbonding process by withdrawing tokens that have finished their unbonding
   * period. The tokens become fully transferable after this call. The numSlashingSpans parameter
   * is required for correct cleanup of staking storage.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const member = keyring.addFromUri("//Bob");
   *
   * // Withdraw unbonded tokens (try with 0 slashing spans first)
   * const tx = client.tx().nominationPools().withdrawUnbonded(member.address, 0);
   * await tx.signAndSend(member);
   * ```
   *
   * @public
   */
  withdrawUnbonded(memberAccount: MultiAddress | AccountId | string, numSlashingSpans: number): SubmittableTransaction {
    const call = new avail.nominationPools.tx.WithdrawUnbonded(MultiAddress.from(memberAccount), numSlashingSpans)
    return SubmittableTransaction.from(this.client, call)
  }
}

/**
 * Builder for Identity pallet transactions.
 *
 * @remarks
 * The Identity pallet allows users to register and manage on-chain identities with
 * associated metadata such as display name, legal name, email, and social media handles.
 * It also supports sub-identities for managing multiple related accounts.
 *
 * @public
 */
export class Identity {
  constructor(private client: Client) {}

  /**
   * Adds a sub-identity to the caller's identity.
   *
   * @param sub - The account address of the sub-identity to add.
   * @param data - Additional data describing the sub-identity relationship.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * Sub-identities allow a primary identity holder to associate other accounts with their
   * main identity, useful for managing multiple wallets or role-based accounts.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const tx = client.tx().identity().addSub("5FHneW46...", { Raw: "Trading Account" });
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  addSub(sub: AccountId | MultiAddress | string, data: avail.identity.types.DataValue): SubmittableTransaction {
    const call = new avail.identity.tx.AddSub(MultiAddress.from(sub), data)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Clears the caller's identity information from the blockchain.
   *
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This removes all identity information associated with the caller's account,
   * including any registered sub-identities.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const tx = client.tx().identity().clearIdentity();
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  clearIdentity(): SubmittableTransaction {
    const call = new avail.identity.tx.ClearIdentity()
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Removes the caller's account from being a sub-identity of another account.
   *
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This allows a sub-identity to dissociate itself from its parent identity.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const subAccount = keyring.addFromUri("//Bob");
   *
   * const tx = client.tx().identity().quitSub();
   * await tx.signAndSend(subAccount);
   * ```
   *
   * @public
   */
  quitSub(): SubmittableTransaction {
    const call = new avail.identity.tx.QuitSub()
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Removes a sub-identity from the caller's identity.
   *
   * @param sub - The account address of the sub-identity to remove.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const tx = client.tx().identity().removeSub("5FHneW46...");
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  removeSub(sub: AccountId | MultiAddress | string): SubmittableTransaction {
    const call = new avail.identity.tx.RemoveSub(MultiAddress.from(sub))
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Sets the identity information for the caller's account.
   *
   * @param info - The identity information object containing fields like display name, legal name, email, etc.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This registers or updates the on-chain identity for the caller. The identity information
   * can include various fields like display name, legal name, email, website, Twitter handle, etc.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const identityInfo = {
   *   display: { Raw: "Alice in Wonderland" },
   *   legal: { None: null },
   *   web: { Raw: "https://alice.example.com" },
   *   email: { Raw: "alice@example.com" },
   *   // ... other fields
   * };
   *
   * const tx = client.tx().identity().setIdentity(identityInfo);
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  setIdentity(info: avail.identity.types.IdentityInfo): SubmittableTransaction {
    const call = new avail.identity.tx.SetIdentity(info)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Sets all sub-identities for the caller's account, replacing any existing ones.
   *
   * @param subs - Array of tuples containing sub-identity account addresses and their associated data.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This replaces the entire list of sub-identities. Any previously registered sub-identities
   * not included in this call will be removed.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const subs = [
   *   ["5FHneW46...", { Raw: "Trading Account" }],
   *   ["5DAAnrj7...", { Raw: "Savings Account" }],
   * ];
   *
   * const tx = client.tx().identity().setSubs(subs);
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  setSubs(subs: [AccountId | string, avail.identity.types.DataValue][]): SubmittableTransaction {
    const s: [AccountId, avail.identity.types.DataValue][] = subs.map((x) => [AccountId.from(x[0], true), x[1]])
    const call = new avail.identity.tx.SetSubs(s)
    return SubmittableTransaction.from(this.client, call)
  }
}

export class Staking {
  constructor(private client: Client) {}
  bond(value: BN, rewardDestination: avail.staking.types.RewardDestinationValue): SubmittableTransaction {
    const call = new avail.staking.tx.Bond(value, rewardDestination)
    return SubmittableTransaction.from(this.client, call)
  }

  bond_extra(value: BN): SubmittableTransaction {
    const call = new avail.staking.tx.BondExtra(value)
    return SubmittableTransaction.from(this.client, call)
  }

  unbond(value: BN): SubmittableTransaction {
    const call = new avail.staking.tx.Unbond(value)
    return SubmittableTransaction.from(this.client, call)
  }

  rebond(value: BN): SubmittableTransaction {
    const call = new avail.staking.tx.Rebond(value)
    return SubmittableTransaction.from(this.client, call)
  }

  validate(commission: number, blocked: boolean): SubmittableTransaction {
    const call = new avail.staking.tx.Validate(new avail.staking.types.ValidatorPerfs(commission, blocked))
    return SubmittableTransaction.from(this.client, call)
  }

  nominate(targets: (MultiAddressValue | string | AccountId)[]): SubmittableTransaction {
    const t = targets.map((x) => MultiAddress.from(x))
    const call = new avail.staking.tx.Nominate(t)
    return SubmittableTransaction.from(this.client, call)
  }

  chillOther(stash: string | AccountId): SubmittableTransaction {
    const call = new avail.staking.tx.ChillOther(AccountId.from(stash, true))
    return SubmittableTransaction.from(this.client, call)
  }

  payoutStakers(validatorStash: string | AccountId, era: number): SubmittableTransaction {
    const call = new avail.staking.tx.PayoutStakers(AccountId.from(validatorStash, true), era)
    return SubmittableTransaction.from(this.client, call)
  }

  setController(): SubmittableTransaction {
    const call = new avail.staking.tx.SetController()
    return SubmittableTransaction.from(this.client, call)
  }

  setPayee(payee: avail.staking.types.RewardDestinationValue): SubmittableTransaction {
    const call = new avail.staking.tx.SetPayee(payee)
    return SubmittableTransaction.from(this.client, call)
  }

  chill(): SubmittableTransaction {
    const call = new avail.staking.tx.Chill()
    return SubmittableTransaction.from(this.client, call)
  }

  withdrawUnbonded(numSlashingSpans: number): SubmittableTransaction {
    const call = new avail.staking.tx.WithdrawUnbonded(numSlashingSpans)
    return SubmittableTransaction.from(this.client, call)
  }

  reapStash(stash: AccountId | string, numSlashingSpans: number): SubmittableTransaction {
    const call = new avail.staking.tx.ReapStash(AccountId.from(stash, true), numSlashingSpans)
    return SubmittableTransaction.from(this.client, call)
  }

  kick(who: (MultiAddress | string | AccountId | MultiAddressValue)[]): SubmittableTransaction {
    const t = who.map((x) => MultiAddress.from(x))
    const call = new avail.staking.tx.Kick(t)
    return SubmittableTransaction.from(this.client, call)
  }

  forceApplyMinCommission(validatorStash: AccountId | string): SubmittableTransaction {
    const call = new avail.staking.tx.ForceApplyMinCommission(AccountId.from(validatorStash, true))
    return SubmittableTransaction.from(this.client, call)
  }

  payoutStakersByPage(validatorStash: string | AccountId, era: number, page: number): SubmittableTransaction {
    const call = new avail.staking.tx.PayoutStakersByPage(AccountId.from(validatorStash, true), era, page)
    return SubmittableTransaction.from(this.client, call)
  }
}

/**
 * Builder for Data Availability pallet transactions.
 *
 * @remarks
 * The Data Availability pallet is the core feature of Avail, enabling users to submit
 * data to the blockchain for data availability guarantees. It also allows creating
 * application-specific namespaces (application keys) for organizing data.
 *
 * @public
 */
export class DataAvailability {
  constructor(private client: Client) {}

  /**
   * Creates a new application key for namespace-specific data submissions.
   *
   * @param data - The name of the application key to create (string or raw bytes).
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * Application keys allow you to create separate namespaces for your data submissions.
   * This is useful for organizing data from different applications or use cases.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const tx = client.tx().dataAvailability().createApplicationKey("MyApp");
   * const result = await tx.signAndSend(alice);
   * console.log("Application key created:", result.txHash.toString());
   * ```
   *
   * @public
   */
  createApplicationKey(data: string | Uint8Array): SubmittableTransaction {
    const d = typeof data === "string" ? new TextEncoder().encode(data) : data
    const call = new avail.dataAvailability.tx.CreateApplicationKey(d)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Submits arbitrary data to the Avail blockchain for data availability.
   *
   * @param data - The data to submit (string or raw bytes).
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This is the primary method for submitting data to Avail. The data will be made
   * available through the data availability layer and can be retrieved by light clients.
   * The data is not stored in the blockchain state, only guaranteed to be available.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * // Submit string data
   * const tx1 = client.tx().dataAvailability().submitData("Hello Avail!");
   * await tx1.signAndSend(alice);
   *
   * // Submit binary data
   * const binaryData = new Uint8Array([1, 2, 3, 4]);
   * const tx2 = client.tx().dataAvailability().submitData(binaryData);
   * await tx2.signAndSend(alice);
   * ```
   *
   * @public
   */
  submitData(data: string | Uint8Array): SubmittableTransaction {
    const d = typeof data === "string" ? new TextEncoder().encode(data) : data
    const call = new avail.dataAvailability.tx.SubmitData(d)
    return SubmittableTransaction.from(this.client, call)
  }
}

/**
 * Builder for Balances pallet transactions.
 *
 * @remarks
 * The Balances pallet handles token transfers and account balance management
 * on the Avail blockchain.
 *
 * @public
 */
export class Balances {
  constructor(private client: Client) {}

  /**
   * Transfers tokens to a destination account, allowing the sender's account to be reaped if the balance goes to zero.
   *
   * @param dest - The destination account address.
   * @param amount - The amount to transfer in the smallest unit (plancks).
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This transfer type allows the sender's account to be deleted (reaped) if the remaining
   * balance falls below the existential deposit. Use {@link transferKeepAlive} if you want
   * to ensure the account remains active.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const amount = new BN("1000000000000000000"); // 1 AVAIL
   * const tx = client.tx().balances().transferAllowDeath("5FHneW46...", amount);
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  transferAllowDeath(dest: AccountId | string | MultiAddress, amount: BN): SubmittableTransaction {
    const call = new avail.balances.tx.TransferAllowDeath(MultiAddress.from(dest), amount)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Transfers tokens to a destination account while ensuring the sender's account stays alive.
   *
   * @param dest - The destination account address.
   * @param amount - The amount to transfer in the smallest unit (plancks).
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This transfer will fail if it would cause the sender's balance to fall below the
   * existential deposit, ensuring the account remains active.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const amount = new BN("500000000000000000"); // 0.5 AVAIL
   * const tx = client.tx().balances().transferKeepAlive("5FHneW46...", amount);
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  transferKeepAlive(dest: AccountId | string | MultiAddress, amount: BN): SubmittableTransaction {
    const call = new avail.balances.tx.TransferKeepAlive(MultiAddress.from(dest), amount)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Transfers the entire balance (or all but existential deposit) to a destination account.
   *
   * @param dest - The destination account address.
   * @param keepAlive - If true, keeps the sender's account alive by retaining the existential deposit; if false, transfers everything and reaps the account.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This is useful for completely emptying an account or transferring the maximum possible
   * amount while keeping it active.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * // Transfer everything and close the account
   * const tx1 = client.tx().balances().transferAll("5FHneW46...", false);
   * await tx1.signAndSend(alice);
   *
   * // Transfer all but existential deposit, keeping account alive
   * const tx2 = client.tx().balances().transferAll("5FHneW46...", true);
   * await tx2.signAndSend(alice);
   * ```
   *
   * @public
   */
  transferAll(dest: AccountId | string | MultiAddress, keepAlive: boolean): SubmittableTransaction {
    const call = new avail.balances.tx.TransferAll(MultiAddress.from(dest), keepAlive)
    return SubmittableTransaction.from(this.client, call)
  }
}

/**
 * Builder for Utility pallet transactions.
 *
 * @remarks
 * The Utility pallet provides helper functions for batching multiple calls into a single
 * transaction, reducing transaction fees and simplifying multi-step operations.
 *
 * @public
 */
export class Utility {
  constructor(private client: Client) {}

  /**
   * Batches multiple calls into a single transaction. Stops processing on first error.
   *
   * @param calls - Array of extrinsic calls to batch together.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * If any call in the batch fails, the remaining calls are not executed, but previous
   * successful calls are not reverted. Use {@link batchAll} if you need atomicity.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const call1 = client.tx().balances().transferKeepAlive("5FHneW46...", new BN(1000));
   * const call2 = client.tx().balances().transferKeepAlive("5DAAnrj7...", new BN(2000));
   *
   * const batchTx = client.tx().utility().batch([call1, call2]);
   * await batchTx.signAndSend(alice);
   * ```
   *
   * @public
   */
  batch(calls: ExtrinsicLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.Batch.create()
    for (const call of calls) {
      tx.push(encodeTransactionCallLike(call))
    }

    return SubmittableTransaction.from(this.client, tx)
  }

  /**
   * Batches multiple calls into a single atomic transaction. Reverts all if any call fails.
   *
   * @param calls - Array of extrinsic calls to batch together.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This provides atomicity - if any call fails, the entire batch is reverted including
   * all previous successful calls. This is useful when all operations must succeed together.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const call1 = client.tx().balances().transferKeepAlive("5FHneW46...", new BN(1000));
   * const call2 = client.tx().dataAvailability().submitData("My data");
   *
   * const batchTx = client.tx().utility().batchAll([call1, call2]);
   * await batchTx.signAndSend(alice);
   * ```
   *
   * @public
   */
  batchAll(calls: ExtrinsicLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.BatchAll.create()
    for (const call of calls) {
      tx.push(encodeTransactionCallLike(call))
    }

    return SubmittableTransaction.from(this.client, tx)
  }

  /**
   * Batches multiple calls and continues execution even if some fail.
   *
   * @param calls - Array of extrinsic calls to batch together.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * Unlike {@link batch}, this continues processing all calls even if some fail.
   * Failed calls do not prevent subsequent calls from executing.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * const call1 = client.tx().balances().transferKeepAlive("5FHneW46...", new BN(1000));
   * const call2 = client.tx().balances().transferKeepAlive("5DAAnrj7...", new BN(2000));
   * const call3 = client.tx().dataAvailability().submitData("Data");
   *
   * // All three calls will be attempted even if one fails
   * const batchTx = client.tx().utility().forceBatch([call1, call2, call3]);
   * await batchTx.signAndSend(alice);
   * ```
   *
   * @public
   */
  forceBatch(calls: ExtrinsicLike[]): SubmittableTransaction {
    const tx = avail.utility.tx.ForceBatch.create()
    for (const call of calls) {
      tx.push(encodeTransactionCallLike(call))
    }

    return SubmittableTransaction.from(this.client, tx)
  }
}

/**
 * Builder for Proxy pallet transactions.
 *
 * @remarks
 * The Proxy pallet enables proxy account management, allowing accounts to act on behalf
 * of others with specific permissions. This is useful for delegating transaction signing
 * authority while maintaining control over what types of operations can be performed.
 * Proxies can have time delays and specific permission types (Any, NonTransfer, Staking, etc.).
 *
 * @public
 */
export class Proxy {
  constructor(private client: Client) {}

  /**
   * Registers a proxy account that can act on behalf of the caller.
   *
   * @param address - The account address to be added as a proxy delegate.
   * @param proxyType - The type of proxy permissions to grant (e.g., "Any", "NonTransfer", "Staking").
   * @param delay - The number of blocks to delay before the proxy can execute transactions (0 for immediate execution).
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * The delay parameter provides a safety mechanism, allowing the original account time to
   * review and potentially cancel delayed proxy transactions before they execute.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * // Add Bob as a proxy with "Any" permissions and no delay
   * const tx = client.tx().proxy().addProxy(
   *   "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", // Bob's address
   *   "Any",
   *   0
   * );
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  addProxy(
    address: MultiAddress | AccountId | string,
    proxyType: avail.proxy.types.ProxyTypeValue,
    delay: number,
  ): SubmittableTransaction {
    const call = new avail.proxy.tx.AddProxy(MultiAddress.from(address), proxyType, delay)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Creates a new pure proxy account with no private key.
   *
   * @param proxyType - The type of proxy permissions for the pure proxy.
   * @param delay - The number of blocks to delay before proxies can execute transactions.
   * @param index - A disambiguation index for creating multiple pure proxies with the same parameters.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * Pure proxies are keyless accounts that can only be controlled through proxy calls.
   * They are useful for creating accounts that must always be operated through specific
   * proxy accounts, providing an additional layer of security and accountability.
   * The pure proxy address is deterministically generated from the creator's address,
   * proxy type, index, and block height.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * // Create a pure proxy with "Any" permissions and index 0
   * const tx = client.tx().proxy().createPure("Any", 0, 0);
   * const result = await tx.signAndSend(alice);
   * // The pure proxy address will be emitted in the PureCreated event
   * ```
   *
   * @public
   */
  createPure(proxyType: avail.proxy.types.ProxyTypeValue, delay: number, index: number): SubmittableTransaction {
    const call = new avail.proxy.tx.CreatePure(proxyType, delay, index)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Removes a pure proxy account and transfers its remaining balance to the caller.
   *
   * @param spawner - The account address that originally created the pure proxy.
   * @param proxyType - The proxy type used when creating the pure proxy.
   * @param index - The disambiguation index used when creating the pure proxy.
   * @param height - The block height at which the pure proxy was created.
   * @param extIndex - The extrinsic index within the block where the pure proxy was created.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This can only be called by an account with proxy permissions for the pure proxy.
   * The spawner, proxyType, index, height, and extIndex parameters must exactly match
   * the values used when the pure proxy was created, as they are used to deterministically
   * derive the pure proxy address.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * // Kill a pure proxy created by Alice at block 100, extrinsic index 2
   * const tx = client.tx().proxy().killPure(
   *   "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // Alice's address (spawner)
   *   "Any",
   *   0, // index
   *   100, // block height
   *   2 // extrinsic index
   * );
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  killPure(
    spawner: MultiAddress | AccountId | string,
    proxyType: avail.proxy.types.ProxyTypeValue,
    index: number,
    height: number,
    extIndex: number,
  ): SubmittableTransaction {
    const call = new avail.proxy.tx.KillPure(MultiAddress.from(spawner), proxyType, index, height, extIndex)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Executes a call as a proxy on behalf of another account.
   *
   * @param id - The account address to execute the call on behalf of (the proxied account).
   * @param forceProxyType - Optional proxy type to force use of specific permissions. Pass null to use any available proxy.
   * @param call - The extrinsic call to execute on behalf of the proxied account.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * The caller must be registered as a proxy for the specified account with sufficient
   * permissions for the call being made. If forceProxyType is specified, only that specific
   * proxy type will be used; otherwise, any suitable proxy permission will be used.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const bob = keyring.addFromUri("//Bob"); // Bob is proxy for Alice
   *
   * // Execute a transfer on behalf of Alice
   * const innerCall = client.tx().balances().transferKeepAlive(
   *   "5DAAnrj7VEk...",
   *   new BN("1000000000000000000")
   * );
   *
   * const tx = client.tx().proxy().proxy(
   *   "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // Alice's address
   *   null, // Use any available proxy type
   *   innerCall
   * );
   * await tx.signAndSend(bob);
   * ```
   *
   * @public
   */
  proxy(
    id: MultiAddress | AccountId | string,
    forceProxyType: avail.proxy.types.ProxyTypeValue | null,
    call: ExtrinsicLike,
  ): SubmittableTransaction {
    const encodedCall = encodeTransactionCallLike(call)
    const c = new avail.proxy.tx.Proxy(MultiAddress.from(id), forceProxyType, encodedCall)
    return SubmittableTransaction.from(this.client, c)
  }

  /**
   * Removes all proxy delegates registered for the caller's account.
   *
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This revokes all proxy permissions that have been granted to other accounts.
   * Use this when you want to completely reset your proxy configuration or remove
   * all delegated access to your account.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * // Remove all proxies for Alice's account
   * const tx = client.tx().proxy().removeProxies();
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  removeProxies(): SubmittableTransaction {
    const call = new avail.proxy.tx.RemoveProxies()
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Removes a specific proxy delegate from the caller's account.
   *
   * @param delegate - The account address of the proxy to remove.
   * @param proxyType - The proxy type that was granted to the delegate.
   * @param delay - The delay value that was set for the proxy.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * All three parameters (delegate, proxyType, and delay) must exactly match an existing
   * proxy registration. If you want to remove all proxies at once, use {@link removeProxies}.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   *
   * // Remove Bob as a proxy (must match the exact parameters used in addProxy)
   * const tx = client.tx().proxy().removeProxy(
   *   "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", // Bob's address
   *   "Any",
   *   0
   * );
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  removeProxy(
    delegate: MultiAddress | AccountId | string,
    proxyType: avail.proxy.types.ProxyTypeValue,
    delay: number,
  ): SubmittableTransaction {
    const call = new avail.proxy.tx.RemoveProxy(MultiAddress.from(delegate), proxyType, delay)
    return SubmittableTransaction.from(this.client, call)
  }
}

/**
 * Builder for Multisig pallet transactions.
 *
 * @remarks
 * The Multisig pallet enables multi-signature functionality, allowing multiple accounts to
 * jointly control operations. A multisig operation requires a threshold number of signatories
 * to approve before execution. This is useful for managing shared accounts, treasury operations,
 * and other scenarios requiring collective approval.
 *
 * @public
 */
export class Multisig {
  constructor(private client: Client) {}

  /**
   * Approves a multisig call without executing it.
   *
   * @param threshold - The minimum number of signatories required to execute the call.
   * @param otherSignatories - Array of other signatory account addresses (excluding the caller).
   * @param maybeTimepoint - The timepoint when the multisig operation was initiated, or null for the first approval.
   * @param callHash - The hash of the call to approve.
   * @param maxWeight - The maximum weight the call can consume.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This registers approval for a multisig call without executing it. Once enough approvals
   * are collected to meet the threshold, any signatory can use {@link asMulti} to execute
   * the call. The timepoint must match the timepoint from when the multisig was initiated.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { blake2AsHex } from "@polkadot/util-crypto";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   * const bob = keyring.addFromUri("//Bob");
   * const charlie = keyring.addFromUri("//Charlie");
   *
   * const threshold = 2;
   * const otherSignatories = [bob.address, charlie.address];
   *
   * // Create the call to execute
   * const innerCall = client.tx().balances().transferKeepAlive(dest, amount);
   * const callHash = blake2AsHex(innerCall.toHex());
   *
   * // Bob approves the call (timepoint from initial multisig creation)
   * const timepoint = { height: 1000, index: 5 };
   * const maxWeight = { refTime: 1000000000n, proofSize: 10000n };
   * const tx = client.tx().multisig().approveAsMulti(
   *   threshold,
   *   [alice.address, charlie.address],
   *   timepoint,
   *   callHash,
   *   maxWeight
   * );
   * await tx.signAndSend(bob);
   * ```
   *
   * @public
   */
  approveAsMulti(
    threshold: number,
    otherSignatories: (AccountId | string)[],
    maybeTimepoint: avail.multisig.types.Timepoint | null,
    callHash: H256 | string,
    maxWeight: Weight,
  ): SubmittableTransaction {
    const ots = otherSignatories.map((x) => AccountId.from(x, true))

    if (typeof callHash === "string") {
      callHash = H256.from(callHash, true)
    }

    const call = new avail.multisig.tx.ApproveAsMulti(threshold, ots, maybeTimepoint, callHash, maxWeight)
    return SubmittableTransaction.from(this.client, call)
  }

  /**
   * Executes or approves a multisig call.
   *
   * @param threshold - The minimum number of signatories required to execute the call.
   * @param otherSignatories - Array of other signatory account addresses (excluding the caller).
   * @param maybeTimepoint - The timepoint when the multisig operation was initiated, or null for the first approval.
   * @param call - The extrinsic call to execute once threshold is met.
   * @param maxWeight - The maximum weight the call can consume.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This is the primary method for multisig operations. If this is the first approval and
   * threshold is greater than 1, the call is stored for later execution. If enough approvals
   * have been collected to meet the threshold, the call is executed immediately. The
   * maybeTimepoint parameter should be null for the first approval and must match the
   * stored timepoint for subsequent approvals.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   * const bob = keyring.addFromUri("//Bob");
   * const charlie = keyring.addFromUri("//Charlie");
   *
   * const threshold = 2;
   * const otherSignatories = [bob.address, charlie.address];
   * const innerCall = client.tx().balances().transferKeepAlive(dest, new BN(1000));
   * const maxWeight = { refTime: 1000000000n, proofSize: 10000n };
   *
   * // Alice initiates the multisig (first approval)
   * const tx1 = client.tx().multisig().asMulti(
   *   threshold,
   *   otherSignatories,
   *   null,
   *   innerCall,
   *   maxWeight
   * );
   * const result = await tx1.signAndSend(alice);
   * const timepoint = { height: result.blockNumber, index: result.txIndex };
   *
   * // Bob provides second approval and executes
   * const tx2 = client.tx().multisig().asMulti(
   *   threshold,
   *   [alice.address, charlie.address],
   *   timepoint,
   *   innerCall,
   *   maxWeight
   * );
   * await tx2.signAndSend(bob);
   * ```
   *
   * @public
   */
  asMulti(
    threshold: number,
    otherSignatories: (AccountId | string)[],
    maybeTimepoint: avail.multisig.types.Timepoint | null,
    call: ExtrinsicLike,
    maxWeight: Weight,
  ): SubmittableTransaction {
    const ots = otherSignatories.map((x) => AccountId.from(x, true))

    const encodedCall = encodeTransactionCallLike(call)
    const c = new avail.multisig.tx.AsMulti(threshold, ots, maybeTimepoint, encodedCall, maxWeight)
    return SubmittableTransaction.from(this.client, c)
  }

  /**
   * Executes a call immediately from a multisig with threshold 1.
   *
   * @param otherSignatories - Array of other signatory account addresses (excluding the caller).
   * @param call - The extrinsic call to execute.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This is an optimized variant for multisig accounts with a threshold of 1, which
   * executes the call immediately without needing approval from other signatories.
   * This is useful for establishing a multisig structure while allowing single-signatory
   * execution.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { BN } from "@polkadot/util";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   * const bob = keyring.addFromUri("//Bob");
   *
   * // Alice can execute immediately with threshold 1
   * const otherSignatories = [bob.address];
   * const innerCall = client.tx().balances().transferKeepAlive(dest, new BN(1000));
   *
   * const tx = client.tx().multisig().asMultiThreshold1(
   *   otherSignatories,
   *   innerCall
   * );
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  asMultiThreshold1(otherSignatories: (AccountId | string)[], call: ExtrinsicLike): SubmittableTransaction {
    const ots = otherSignatories.map((x) => AccountId.from(x, true))

    const encodedCall = encodeTransactionCallLike(call)
    const c = new avail.multisig.tx.AsMultiThreshold1(ots, encodedCall)
    return SubmittableTransaction.from(this.client, c)
  }

  /**
   * Cancels a pending multisig call.
   *
   * @param threshold - The minimum number of signatories required for the multisig.
   * @param otherSignatories - Array of other signatory account addresses (excluding the caller).
   * @param timepoint - The timepoint when the multisig operation was initiated.
   * @param callHash - The hash of the call to cancel.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This cancels a pending multisig operation, removing it from storage and preventing
   * further approvals or execution. Only a signatory who has already approved the call
   * can cancel it. The timepoint must match exactly the timepoint from when the multisig
   * was initiated.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   * import { blake2AsHex } from "@polkadot/util-crypto";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const alice = keyring.addFromUri("//Alice");
   * const bob = keyring.addFromUri("//Bob");
   * const charlie = keyring.addFromUri("//Charlie");
   *
   * const threshold = 2;
   * const otherSignatories = [bob.address, charlie.address];
   *
   * // Hash of the call that was initiated
   * const innerCall = client.tx().balances().transferKeepAlive(dest, amount);
   * const callHash = blake2AsHex(innerCall.toHex());
   *
   * // Cancel the multisig operation
   * const timepoint = { height: 1000, index: 5 };
   * const tx = client.tx().multisig().cancelAsMulti(
   *   threshold,
   *   otherSignatories,
   *   timepoint,
   *   callHash
   * );
   * await tx.signAndSend(alice);
   * ```
   *
   * @public
   */
  cancelAsMulti(
    threshold: number,
    otherSignatories: (AccountId | string)[],
    timepoint: avail.multisig.types.Timepoint,
    callHash: H256 | string,
  ): SubmittableTransaction {
    const ots = otherSignatories.map((x) => AccountId.from(x, true))

    if (typeof callHash === "string") {
      callHash = H256.from(callHash, true)
    }

    const call = new avail.multisig.tx.CancelAsMulti(threshold, ots, timepoint, callHash)
    return SubmittableTransaction.from(this.client, call)
  }
}

/**
 * Builder for Sudo pallet transactions.
 *
 * @remarks
 * The Sudo pallet provides privileged functions that can only be executed by the designated
 * sudo account. This is typically used for chain governance and administrative operations.
 *
 * @public
 */
export class Sudo {
  constructor(private client: Client) {}

  /**
   * Executes a call with sudo (superuser) privileges.
   *
   * @param call - The extrinsic call to execute with elevated privileges.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This can only be successfully executed by the chain's designated sudo account.
   * Attempting to use this from a non-sudo account will fail.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const sudoAccount = keyring.addFromUri("//Alice"); // Assuming Alice is sudo
   *
   * // Execute a privileged call
   * const innerCall = client.tx().balances().transferKeepAlive(dest, amount);
   * const tx = client.tx().sudo().sudo(innerCall);
   * await tx.signAndSend(sudoAccount);
   * ```
   *
   * @public
   */
  sudo(call: ExtrinsicLike): SubmittableTransaction {
    const c = new avail.sudo.tx.Sudo(encodeTransactionCallLike(call))
    return SubmittableTransaction.from(this.client, c)
  }

  /**
   * Executes a call with sudo privileges on behalf of another account.
   *
   * @param who - The account address to execute the call as.
   * @param call - The extrinsic call to execute.
   * @returns A SubmittableTransaction that can be signed and submitted.
   *
   * @remarks
   * This allows the sudo account to execute a call as if it were sent by another account.
   * The transaction is still signed by the sudo account, but the call appears to come from
   * the specified account.
   *
   * @example
   * ```ts
   * import { Keyring } from "@polkadot/keyring";
   *
   * const keyring = new Keyring({ type: "sr25519" });
   * const sudoAccount = keyring.addFromUri("//Alice");
   *
   * // Execute a call as Bob
   * const innerCall = client.tx().balances().transferKeepAlive(dest, amount);
   * const tx = client.tx().sudo().sudoAs("5FHneW46...", innerCall);
   * await tx.signAndSend(sudoAccount);
   * ```
   *
   * @public
   */
  sudoAs(who: MultiAddressValue | AccountId | string, call: ExtrinsicLike): SubmittableTransaction {
    const c = new avail.sudo.tx.SudoAs(MultiAddress.from(who), encodeTransactionCallLike(call))
    return SubmittableTransaction.from(this.client, c)
  }
}
