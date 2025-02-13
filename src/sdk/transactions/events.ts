import { EventRecord as PolkaEventRecord, H256 } from "@polkadot/types/interfaces/types"
import { BN, sdkTransactions } from ".."
import { ApiPromise } from "@polkadot/api"
import { Client } from "../client"


export class EventRecords {
  public inner: EventRecord[]

  constructor(value: EventRecord[]) {
    this.inner = value
  }

  static new(values: PolkaEventRecord[]): EventRecords {
    let inner = values.map((v) => new EventRecord(v))
    return new EventRecords(inner)
  }

  iter(): EventRecord[] {
    return this.inner
  }

  find<T>(c: { decode(arg0: PolkaEventRecord): T | undefined }): T[] {
    const decoded_events = []

    for (const event of this.inner) {
      const decoded_event = c.decode(event.inner)
      if (decoded_event != null) {
        decoded_events.push(decoded_event)
      }
    }

    return decoded_events
  }


  findFirst<T>(c: { decode(arg0: PolkaEventRecord): T | undefined }): T | undefined {
    for (const event of this.inner) {
      const decoded_event = c.decode(event.inner)
      if (decoded_event != null) {
        return decoded_event
      }
    }

    return undefined
  }

  static async fetch(client: Client, blockHash: H256 | string, txIndex?: number): Promise<EventRecords> {
    const storageAt = await client.storageAt(blockHash)
    const eventRecords = (await storageAt.system.events()) as any as PolkaEventRecord[]

    if (txIndex != undefined) {
      return EventRecords.new(eventRecords.filter((e) => {
        return e.phase.isApplyExtrinsic && e.phase.asApplyExtrinsic.toNumber() == txIndex
      }))
    }

    return EventRecords.new(eventRecords)
  }
}

export class EventRecord {
  public inner: PolkaEventRecord

  constructor(value: PolkaEventRecord) {
    this.inner = value
  }

  palletName(): string {
    return this.inner.event.section
  }

  palletIndex() {

  }

  eventName(): string {
    return this.inner.event.method
  }

  eventIndex() {
  }

  txIndex(): number | undefined {
    if (!this.inner.phase.isApplyExtrinsic) {
      return undefined
    }

    return this.inner.phase.asApplyExtrinsic.toNumber()
  }
}

export namespace Balances {
  export class Transfer {
    constructor(
      public from: string,
      public to: string,
      public amount: BN,
    ) { }

    static decode(event: PolkaEventRecord): Transfer | undefined {
      if (event.event.section != "balances" || event.event.method != "Transfer") {
        return undefined
      }
      const ed: any = event.event.data

      return new Transfer(ed["from"].toString(), ed["to"].toString(), ed["amount"])
    }
  }
}

export namespace System {
  export class KilledAccount {
    constructor(public account: string) { }

    static decode(event: PolkaEventRecord): KilledAccount | undefined {
      if (event.event.section != "system" || event.event.method != "Killed") {
        return undefined
      }
      const ed: any = event.event.data

      return new KilledAccount(ed["account"].toString())
    }
  }

  export class ExtrinsicSuccess {
    constructor() { }

    static decode(event: PolkaEventRecord): ExtrinsicSuccess | undefined {
      if (event.event.section != "system" || event.event.method != "ExtrinsicSuccess") {
        return undefined
      }
      const ed: any = event.event.data

      return new ExtrinsicSuccess()
    }
  }

  export class ExtrinsicFailed {
    constructor() { }

    static decode(event: PolkaEventRecord): ExtrinsicFailed | undefined {
      if (event.event.section != "system" || event.event.method != "ExtrinsicFailed") {
        return undefined
      }
      const ed: any = event.event.data

      return new ExtrinsicFailed()
    }
  }
}

export namespace DataAvailability {
  export class DataSubmitted {
    constructor(
      public who: string,
      public dataHash: string,
    ) { }

    static decode(event: PolkaEventRecord): DataSubmitted | undefined {
      if (event.event.section != "dataAvailability" || event.event.method != "DataSubmitted") {
        return undefined
      }
      const ed: any = event.event.data

      return new DataSubmitted(ed["who"].toString(), ed["dataHash"].toString())
    }
  }

  export class ApplicationKeyCreated {
    constructor(
      public key: string,
      public owner: string,
      public id: number,
    ) { }

    static decode(event: PolkaEventRecord): ApplicationKeyCreated | undefined {
      if (event.event.section != "dataAvailability" || event.event.method != "ApplicationKeyCreated") {
        return undefined
      }
      const ed: any = event.event.data

      return new ApplicationKeyCreated(ed["key"].toString(), ed["owner"].toString(), parseInt(ed["id"].toString()))
    }
  }
}

export namespace Multisig {
  export class MultisigApproval {
    constructor(
      public approving: string,
      public timepoint: sdkTransactions.MultisigTimepoint,
      public multisig: string,
      public callHash: string,
    ) { }

    static decode(event: PolkaEventRecord): MultisigApproval | undefined {
      if (event.event.section != "multisig" || event.event.method != "MultisigApproval") {
        return undefined
      }
      const ed: any = event.event.data

      const timepoint = {
        height: parseInt(ed["timepoint"].height.toString()),
        index: parseInt(ed["timepoint"].index.toString()),
      }

      return new MultisigApproval(
        ed["approving"].toString(),
        timepoint,
        ed["multisig"].toString(),
        ed["callHash"].toString(),
      )
    }
  }

  export class MultisigExecuted {
    constructor(
      public approving: string,
      public timepoint: sdkTransactions.MultisigTimepoint,
      public multisig: string,
      public callHash: string,
      public result: string,
    ) { }

    static decode(event: PolkaEventRecord): MultisigExecuted | undefined {
      if (event.event.section != "multisig" || event.event.method != "MultisigExecuted") {
        return undefined
      }
      const ed: any = event.event.data

      const timepoint = {
        height: parseInt(ed["timepoint"].height.toString()),
        index: parseInt(ed["timepoint"].index.toString()),
      }

      return new MultisigExecuted(
        ed["approving"].toString(),
        timepoint,
        ed["multisig"].toString(),
        ed["callHash"].toString(),
        ed["result"].toString(),
      )
    }
  }

  export class NewMultisig {
    constructor(
      public approving: string,
      public multisig: string,
      public callHash: string,
    ) { }

    static decode(event: PolkaEventRecord): NewMultisig | undefined {
      if (event.event.section != "multisig" || event.event.method != "NewMultisig") {
        return undefined
      }
      const ed: any = event.event.data

      return new NewMultisig(ed["approving"].toString(), ed["multisig"].toString(), ed["callHash"].toString())
    }
  }
}

export namespace NominationPools {
  export class Bonded {
    constructor(
      public member: string,
      public poolId: string,
      public bonded: string,
      public joined: string,
    ) { }

    static decode(event: PolkaEventRecord): Bonded | undefined {
      if (event.event.section != "nominationPools" || event.event.method != "Bonded") {
        return undefined
      }
      const ed: any = event.event.data

      return new Bonded(
        ed["member"].toString(),
        ed["poolId"].toString(),
        ed["bonded"].toString(),
        ed["joined"].toString(),
      )
    }
  }

  export class Created {
    constructor(
      public depositor: string,
      public poolId: string,
    ) { }

    static decode(event: PolkaEventRecord): Created | undefined {
      if (event.event.section != "nominationPools" || event.event.method != "Created") {
        return undefined
      }
      const ed: any = event.event.data

      return new Created(ed["depositor"].toString(), ed["poolId"].toString())
    }
  }

  export class Unbonded {
    constructor(
      public member: string,
      public poolId: string,
      public balance: string,
      public points: string,
      public era: string,
    ) { }

    static decode(event: PolkaEventRecord): Unbonded | undefined {
      if (event.event.section != "nominationPools" || event.event.method != "Unbonded") {
        return undefined
      }
      const ed: any = event.event.data

      return new Unbonded(
        ed["member"].toString(),
        ed["poolId"].toString(),
        ed["balance"].toString(),
        ed["points"].toString(),
        ed["era"].toString(),
      )
    }
  }

  export class PoolCommissionClaimed {
    constructor(
      public poolId: string,
      public commission: string,
    ) { }

    static decode(event: PolkaEventRecord): PoolCommissionClaimed | undefined {
      if (event.event.section != "nominationPools" || event.event.method != "PoolCommissionClaimed") {
        return undefined
      }
      const ed: any = event.event.data

      return new PoolCommissionClaimed(ed["poolId"].toString(), ed["commission"].toString())
    }
  }

  export class PaidOut {
    constructor(
      public member: string,
      public poolId: string,
      public payout: string,
    ) { }

    static decode(event: PolkaEventRecord): PaidOut | undefined {
      if (event.event.section != "nominationPools" || event.event.method != "PaidOut") {
        return undefined
      }
      const ed: any = event.event.data

      return new PaidOut(ed["member"].toString(), ed["poolId"].toString(), ed["payout"].toString())
    }
  }

  export class PoolCommissionUpdated {
    constructor(
      public poolId: string,
      public current: string,
    ) { }

    static decode(event: PolkaEventRecord): PoolCommissionUpdated | undefined {
      if (event.event.section != "nominationPools" || event.event.method != "PoolCommissionUpdated") {
        return undefined
      }
      const ed: any = event.event.data

      return new PoolCommissionUpdated(ed["poolId"].toString(), ed["current"].toString())
    }
  }

  export class Withdrawn {
    constructor(
      public member: string,
      public poolId: string,
      public balance: string,
      public points: string,
    ) { }

    static decode(event: PolkaEventRecord): Withdrawn | undefined {
      if (event.event.section != "nominationPools" || event.event.method != "Withdrawn") {
        return undefined
      }
      const ed: any = event.event.data

      return new Withdrawn(
        ed["member"].toString(),
        ed["poolId"].toString(),
        ed["balance"].toString(),
        ed["points"].toString(),
      )
    }
  }

  export class StateChanged {
    constructor(
      public poolId: string,
      public newState: string,
    ) { }

    static decode(event: PolkaEventRecord): StateChanged | undefined {
      if (event.event.section != "nominationPools" || event.event.method != "StateChanged") {
        return undefined
      }
      const ed: any = event.event.data

      return new StateChanged(ed["poolId"].toString(), ed["newState"].toString())
    }
  }
}

export namespace Staking {
  export class Bonded {
    constructor(
      public stash: string,
      public amount: string,
    ) { }

    static decode(event: PolkaEventRecord): Bonded | undefined {
      if (event.event.section != "staking" || event.event.method != "Bonded") {
        return undefined
      }
      const ed: any = event.event.data

      const amountString = ed["amount"].toString()
      const amount = new BN(amountString).div(new BN(10).pow(new BN(18))).toString()

      return new Bonded(ed["stash"].toString(), amount)
    }
  }

  export class Chilled {
    constructor(public stash: string) { }

    static decode(event: PolkaEventRecord): Chilled | undefined {
      if (event.event.section != "staking" || event.event.method != "Chilled") {
        return undefined
      }
      const ed: any = event.event.data

      return new Chilled(ed["stash"].toString())
    }
  }

  export class Unbonded {
    constructor(
      public stash: string,
      public amount: string,
    ) { }

    static decode(event: PolkaEventRecord): Unbonded | undefined {
      if (event.event.section != "staking" || event.event.method != "Unbonded") {
        return undefined
      }
      const ed: any = event.event.data

      return new Unbonded(ed["stash"].toString(), ed["amount"].toString())
    }
  }

  export class ValidatorPrefsSet {
    constructor(
      public stash: string,
      public commission: string,
      public blocked: string,
    ) { }

    static decode(event: PolkaEventRecord): ValidatorPrefsSet | undefined {
      if (event.event.section != "staking" || event.event.method != "ValidatorPrefsSet") {
        return undefined
      }
      const ed: any = event.event.data

      return new ValidatorPrefsSet(
        ed["stash"].toString(),
        ed["prefs"]["commission"].toString(),
        ed["prefs"]["blocked"].toString(),
      )
    }
  }
}

export namespace Utility {
  export class BatchCompleted {
    constructor() { }

    static decode(event: PolkaEventRecord): BatchCompleted | undefined {
      if (event.event.section != "utility" || event.event.method != "BatchCompleted") {
        return undefined
      }

      return new BatchCompleted()
    }
  }

  export class BatchCompletedWithErrors {
    constructor() { }

    static decode(event: PolkaEventRecord): BatchCompletedWithErrors | undefined {
      if (event.event.section != "utility" || event.event.method != "BatchCompletedWithErrors") {
        return undefined
      }

      return new BatchCompletedWithErrors()
    }
  }

  export class ItemFailed {
    constructor() { }

    static decode(event: PolkaEventRecord): ItemFailed | undefined {
      if (event.event.section != "utility" || event.event.method != "ItemFailed") {
        return undefined
      }
      const ed: any = event.event.data

      return new ItemFailed()
    }
  }

  export class ItemCompleted {
    constructor() { }

    static decode(event: PolkaEventRecord): ItemCompleted | undefined {
      if (event.event.section != "utility" || event.event.method != "ItemCompleted") {
        return undefined
      }
      const ed: any = event.event.data

      return new ItemCompleted()
    }
  }

  export class BatchInterrupted {
    constructor() { }

    static decode(event: PolkaEventRecord): BatchInterrupted | undefined {
      if (event.event.section != "utility" || event.event.method != "BatchInterrupted") {
        return undefined
      }
      const ed: any = event.event.data

      return new BatchInterrupted()
    }
  }
}

/* export namespace TransactionData {
  export class Nominate {
    constructor(public targets: string[]) {}

    static async New(api: ApiPromise, txHash: H256, blockHash: H256): Promise<Result<Nominate, string>> {
      const block = await api.rpc.chain.getBlock(blockHash)
      const tx = block.block.extrinsics.find((tx) => tx.hash.toHex() == txHash.toHex())
      if (tx == undefined) return err("Failed to find nominate transaction.")

      const targets = []
      const txTargets = tx.method.args[0] as any
      for (let i = 0; i < txTargets.length; ++i) {
        targets.push(txTargets[i].toString())
      }

      return ok(new Nominate(targets))
    }
  }
}
 */

/* export namespace TransactionData {
  export class SubmitData {
    constructor(public data: string) {}

    static async New(api: ApiPromise, txHash: H256, blockHash: H256): Promise<Result<SubmitData, string>> {
      const block = await api.rpc.chain.getBlock(blockHash)
      const tx = block.block.extrinsics.find((tx) => tx.hash.toHex() == txHash.toHex())
      if (tx == undefined) return err("Failed to find submit data transaction.")

      // Data retrieved from the extrinsic data
      let dataHex = tx.method.args.map((a) => a.toString()).join(", ")
      if (dataHex.startsWith("0x")) {
        dataHex = dataHex.slice(2)
      }

      return ok(new SubmitData(dataHex))
    }
  }
}
 */
