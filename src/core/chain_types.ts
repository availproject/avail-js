import Encoder from "./encoder"
import Decoder from "./decoder"
import { CompactU32 } from "./coded_types"
import { AccountId, BN, GeneralError, H256, MultiAddress, ProxyType, Weight } from "."
import { Hex, mergeArrays } from "./utils"
import { GenericExtrinsic } from "@polkadot/types"
import { Encodable, HasTxDispatchIndex, TransactionCall } from "./decode_transaction"

class RuntimeCall {
  public BalancesTransferAllDeath: balances.tx.TransferAllowDeath | null = null
  public BalancesTransferKeepAlive: balances.tx.TransferKeepAlive | null = null
  public BalancesTransferAll: balances.tx.TransferAll | null = null
  public UtilityBatch: utility.tx.Batch | null = null
  public UtilityBatchAll: utility.tx.BatchAll | null = null
  public UtilityForceBatch: utility.tx.ForceBatch | null = null
  public SystemRemark: system.tx.Remark | null = null
  public SystemSetCode: system.tx.SetCode | null = null
  public SystemSetCodeWithoutChecks: system.tx.SetCodeWithoutChecks | null = null
  public SystemRemarkWithEvent: system.tx.RemarkWithEvent | null = null
  public ProxyProxy: proxy.tx.Proxy | null = null
  public ProxyAddProxy: proxy.tx.AddProxy | null = null
  public ProxyRemoveProxy: proxy.tx.RemoveProxy | null = null
  public ProxyRemoveProxies: proxy.tx.RemoveProxies | null = null
  public ProxyCreatePure: proxy.tx.CreatePure | null = null
  public ProxyKillPure: proxy.tx.KillPure | null = null
  public MultisigAsMultiThreshold1: multisig.tx.AsMultiThreshold1 | null = null
  public MultisigAsMulti: multisig.tx.AsMulti | null = null
  public MultisigApproveAsMulti: multisig.tx.ApproveAsMulti | null = null
  public MultisigCancelAsMulti: multisig.tx.CancelAsMulti | null = null
  public DataAvailabilityCreateApplicationKey: dataAvailability.tx.CreateApplicationKey | null = null

  public constructor() {}

  public static decode(decoder: Decoder): RuntimeCall | GeneralError {
    const palletId = decoder.u8()
    const callId = decoder.u8()

    const runtimeCall = new RuntimeCall()
    if (palletId == balances.PALLET_INDEX) {
      if (callId == balances.tx.TransferAllowDeath.dispatchIndex()[1]) {
        const decoded = balances.tx.TransferAllowDeath.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.BalancesTransferAllDeath = decoded
        return runtimeCall
      }

      if (callId == balances.tx.TransferKeepAlive.dispatchIndex()[1]) {
        const decoded = balances.tx.TransferKeepAlive.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.BalancesTransferKeepAlive = decoded
        return runtimeCall
      }

      if (callId == balances.tx.TransferAll.dispatchIndex()[1]) {
        const decoded = balances.tx.TransferAll.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.BalancesTransferAll = decoded
        return runtimeCall
      }
    }

    if (palletId == utility.PALLET_INDEX) {
      if (callId == utility.tx.Batch.dispatchIndex()[1]) {
        const decoded = utility.tx.Batch.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.UtilityBatch = decoded
        return runtimeCall
      }

      if (callId == utility.tx.BatchAll.dispatchIndex()[1]) {
        const decoded = utility.tx.BatchAll.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.UtilityBatchAll = decoded
        return runtimeCall
      }

      if (callId == utility.tx.ForceBatch.dispatchIndex()[1]) {
        const decoded = utility.tx.ForceBatch.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.UtilityForceBatch = decoded
        return runtimeCall
      }
    }

    if (palletId == system.PALLET_INDEX) {
      if (callId == system.tx.Remark.dispatchIndex()[1]) {
        const decoded = system.tx.Remark.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.SystemRemark = decoded
        return runtimeCall
      }

      if (callId == system.tx.SetCode.dispatchIndex()[1]) {
        const decoded = system.tx.SetCode.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.SystemSetCode = decoded
        return runtimeCall
      }

      if (callId == system.tx.SetCodeWithoutChecks.dispatchIndex()[1]) {
        const decoded = system.tx.SetCodeWithoutChecks.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.SystemSetCodeWithoutChecks = decoded
        return runtimeCall
      }

      if (callId == system.tx.RemarkWithEvent.dispatchIndex()[1]) {
        const decoded = system.tx.RemarkWithEvent.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.SystemRemarkWithEvent = decoded
        return runtimeCall
      }
    }

    if (palletId == proxy.PALLET_INDEX) {
      if (callId == proxy.tx.Proxy.dispatchIndex()[1]) {
        const decoded = proxy.tx.Proxy.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.ProxyProxy = decoded
        return runtimeCall
      }

      if (callId == proxy.tx.AddProxy.dispatchIndex()[1]) {
        const decoded = proxy.tx.AddProxy.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.ProxyAddProxy = decoded
        return runtimeCall
      }

      if (callId == proxy.tx.RemoveProxy.dispatchIndex()[1]) {
        const decoded = proxy.tx.RemoveProxy.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.ProxyRemoveProxy = decoded
        return runtimeCall
      }

      if (callId == proxy.tx.RemoveProxies.dispatchIndex()[1]) {
        const decoded = proxy.tx.RemoveProxies.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.ProxyRemoveProxies = decoded
        return runtimeCall
      }

      if (callId == proxy.tx.CreatePure.dispatchIndex()[1]) {
        const decoded = proxy.tx.CreatePure.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.ProxyCreatePure = decoded
        return runtimeCall
      }

      if (callId == proxy.tx.KillPure.dispatchIndex()[1]) {
        const decoded = proxy.tx.KillPure.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.ProxyKillPure = decoded
        return runtimeCall
      }
    }

    if (palletId == multisig.PALLET_INDEX) {
      if (callId == multisig.tx.AsMultiThreshold1.dispatchIndex()[1]) {
        const decoded = multisig.tx.AsMultiThreshold1.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.MultisigAsMultiThreshold1 = decoded
        return runtimeCall
      }

      if (callId == multisig.tx.AsMulti.dispatchIndex()[1]) {
        const decoded = multisig.tx.AsMulti.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.MultisigAsMulti = decoded
        return runtimeCall
      }

      if (callId == multisig.tx.ApproveAsMulti.dispatchIndex()[1]) {
        const decoded = multisig.tx.ApproveAsMulti.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.MultisigApproveAsMulti = decoded
        return runtimeCall
      }

      if (callId == multisig.tx.CancelAsMulti.dispatchIndex()[1]) {
        const decoded = multisig.tx.CancelAsMulti.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.MultisigCancelAsMulti = decoded
        return runtimeCall
      }
    }

    if (palletId == dataAvailability.PALLET_INDEX) {
      if (callId == dataAvailability.tx.CreateApplicationKey.dispatchIndex()[1]) {
        const decoded = dataAvailability.tx.CreateApplicationKey.decode(decoder)
        if (decoded instanceof GeneralError) return decoded

        runtimeCall.DataAvailabilityCreateApplicationKey = decoded
        return runtimeCall
      }
    }

    return new GeneralError("Failed to decode runtime call")
  }
}

export namespace dataAvailability {
  export const PALLET_NAME: string = "dataAvailability"
  export const PALLET_INDEX: number = 29

  export namespace tx {
    export class CreateApplicationKey {
      constructor(public key: Uint8Array) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "createApplicationKey"

      encode(): Uint8Array {
        return Encoder.vecU8(this.key)
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return CreateApplicationKey.dispatchIndex()
      }

      static decode(decoder: Decoder): CreateApplicationKey | GeneralError {
        const value = decoder.vecU8()
        if (value instanceof GeneralError) return value

        return new CreateApplicationKey(value)
      }
    }

    export class SubmitData {
      constructor(public data: Uint8Array) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "submitData"

      encode(): Uint8Array {
        return Encoder.vecU8(this.data)
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 1]
      }

      dispatchIndex(): [number, number] {
        return SubmitData.dispatchIndex()
      }

      static decode(decoder: Decoder): SubmitData | GeneralError {
        const value = decoder.vecU8()
        if (value instanceof GeneralError) return value

        return new SubmitData(value)
      }
    }
  }
}

export namespace timestamp {
  export const PALLET_NAME: string = "timestamp"
  export const PALLET_INDEX: number = 3

  export namespace tx {
    export class Set {
      constructor(public now: BN) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "set"

      encode(): Uint8Array {
        return Encoder.u64(this.now, true)
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return Set.dispatchIndex()
      }

      static decode(decoder: Decoder): Set | GeneralError {
        const value = decoder.u64(true)
        if (value instanceof GeneralError) return value

        return new Set(value)
      }
    }
  }
}

export namespace vector {
  export const PALLET_NAME: string = "vector"
  export const PALLET_INDEX: number = 39

  export namespace tx {
    export class FailedSendMessageTxs {
      constructor(public failedTxs: number[]) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "failedSendMessageTxs"

      encode(): Uint8Array {
        return Encoder.vec(this.failedTxs.map((x) => new CompactU32(x)))
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 11]
      }

      dispatchIndex(): [number, number] {
        return FailedSendMessageTxs.dispatchIndex()
      }

      static decode(decoder: Decoder): FailedSendMessageTxs | GeneralError {
        const value = decoder.vec(CompactU32)
        if (value instanceof GeneralError) return value

        return new FailedSendMessageTxs(value)
      }
    }
  }
}

export namespace utility {
  export const PALLET_NAME: string = "utility"
  export const PALLET_INDEX: number = 1

  export namespace tx {
    export class Batch {
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "batch"

      private _length: number = 0 // Compact<u32>
      private _calls: Uint8Array = new Uint8Array() // Already encoded

      private constructor(length: number, calls: Uint8Array) {
        this._length = length
        this._calls = calls
      }

      public static create(): Batch {
        return new Batch(0, new Uint8Array())
      }

      public decodeCalls(): RuntimeCall[] | GeneralError {
        if (this._length == 0) {
          return []
        }

        const runtimeCalls = []
        const decoder = new Decoder(this._calls)
        for (let i = 0; i < this._length; ++i) {
          const decoded = RuntimeCall.decode(decoder)
          if (decoded instanceof GeneralError) return decoded

          runtimeCalls.push(decoded)
        }

        if (decoder.remainingLen() > 0) {
          return new GeneralError("Failed to decode batch calls")
        }

        return runtimeCalls
      }

      public addGenericExt(value: GenericExtrinsic) {
        this.add(value.method.toU8a())
      }

      public addCall(T: Encodable & HasTxDispatchIndex) {
        const palletId = T.dispatchIndex()[0]
        const callId = T.dispatchIndex()[1]
        const encodedCallData = T.encode()
        this.add(mergeArrays([Encoder.u8(palletId), Encoder.u8(callId), encodedCallData]))
      }

      public addHex(value: string): null | GeneralError {
        const decoded = Hex.decode(value)
        if (decoded instanceof GeneralError) return decoded

        this.add(decoded)
        return null
      }

      public add(value: Uint8Array) {
        this._length += 1
        this._calls = mergeArrays([this._calls, value])
      }

      public length(): number {
        return this._length
      }

      public calls(): Uint8Array {
        return this._calls
      }

      encode(): Uint8Array {
        return mergeArrays([Encoder.u32(this._length, true), this._calls])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return Batch.dispatchIndex()
      }

      static decode(decoder: Decoder): Batch | GeneralError {
        const length = decoder.u32(true)
        if (length instanceof GeneralError) return length

        const calls = decoder.remainingBytes()
        return new Batch(length, calls)
      }
    }

    export class BatchAll {
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "batchAll"

      private _length: number = 0 // Compact<u32>
      private _calls: Uint8Array = new Uint8Array() // Already encoded

      private constructor(length: number, calls: Uint8Array) {
        this._length = length
        this._calls = calls
      }

      public static create(): BatchAll {
        return new BatchAll(0, new Uint8Array())
      }

      public decodeCalls(): RuntimeCall[] | GeneralError {
        if (this._length == 0) {
          return []
        }

        const runtimeCalls = []
        const decoder = new Decoder(this._calls)
        for (let i = 0; i < this._length; ++i) {
          const decoded = RuntimeCall.decode(decoder)
          if (decoded instanceof GeneralError) return decoded

          runtimeCalls.push(decoded)
        }

        if (decoder.remainingLen() > 0) {
          return new GeneralError("Failed to decode batch-all calls")
        }

        return runtimeCalls
      }

      public addGenericExt(value: GenericExtrinsic) {
        this.add(value.method.toU8a())
      }

      public addCall(T: Encodable & HasTxDispatchIndex) {
        const palletId = T.dispatchIndex()[0]
        const callId = T.dispatchIndex()[1]
        const encodedCallData = T.encode()
        this.add(mergeArrays([Encoder.u8(palletId), Encoder.u8(callId), encodedCallData]))
      }

      public addHex(value: string): null | GeneralError {
        const decoded = Hex.decode(value)
        if (decoded instanceof GeneralError) return decoded

        this.add(decoded)
        return null
      }

      public add(value: Uint8Array) {
        this._length += 1
        this._calls = mergeArrays([this._calls, value])
      }

      public length(): number {
        return this._length
      }

      public calls(): Uint8Array {
        return this._calls
      }

      encode(): Uint8Array {
        return mergeArrays([Encoder.u32(this._length, true), this._calls])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 2]
      }

      dispatchIndex(): [number, number] {
        return Batch.dispatchIndex()
      }

      static decode(decoder: Decoder): BatchAll | GeneralError {
        const length = decoder.u32(true)
        if (length instanceof GeneralError) return length

        const calls = decoder.remainingBytes()
        return new BatchAll(length, calls)
      }
    }

    export class ForceBatch {
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "forceBatch"

      private _length: number = 0 // Compact<u32>
      private _calls: Uint8Array = new Uint8Array() // Already encoded

      private constructor(length: number, calls: Uint8Array) {
        this._length = length
        this._calls = calls
      }

      public static create(): ForceBatch {
        return new ForceBatch(0, new Uint8Array())
      }

      public decodeCalls(): RuntimeCall[] | GeneralError {
        if (this._length == 0) {
          return []
        }

        const runtimeCalls = []
        const decoder = new Decoder(this._calls)
        for (let i = 0; i < this._length; ++i) {
          const decoded = RuntimeCall.decode(decoder)
          if (decoded instanceof GeneralError) return decoded

          runtimeCalls.push(decoded)
        }

        if (decoder.remainingLen() > 0) {
          return new GeneralError("Failed to decode force-batch calls")
        }

        return runtimeCalls
      }

      public addGenericExt(value: GenericExtrinsic) {
        this.add(value.method.toU8a())
      }

      public addCall(T: Encodable & HasTxDispatchIndex) {
        const palletId = T.dispatchIndex()[0]
        const callId = T.dispatchIndex()[1]
        const encodedCallData = T.encode()
        this.add(mergeArrays([Encoder.u8(palletId), Encoder.u8(callId), encodedCallData]))
      }

      public addHex(value: string): null | GeneralError {
        const decoded = Hex.decode(value)
        if (decoded instanceof GeneralError) return decoded

        this.add(decoded)
        return null
      }

      public add(value: Uint8Array) {
        this._length += 1
        this._calls = mergeArrays([this._calls, value])
      }

      public length(): number {
        return this._length
      }

      public calls(): Uint8Array {
        return this._calls
      }

      encode(): Uint8Array {
        return mergeArrays([Encoder.u32(this._length, true), this._calls])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 2]
      }

      dispatchIndex(): [number, number] {
        return Batch.dispatchIndex()
      }

      static decode(decoder: Decoder): ForceBatch | GeneralError {
        const length = decoder.u32(true)
        if (length instanceof GeneralError) return length

        const calls = decoder.remainingBytes()
        return new ForceBatch(length, calls)
      }
    }
  }
}

export namespace system {
  export const PALLET_NAME: string = "system"
  export const PALLET_INDEX: number = 0

  export namespace tx {
    export class Remark {
      constructor(
        public remark: Uint8Array, // Vec<u8>,
      ) {}

      encode(): Uint8Array {
        return mergeArrays([Encoder.vecU8(this.remark)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return Remark.dispatchIndex()
      }

      static decode(decoder: Decoder): Remark | GeneralError {
        const remark = decoder.vecU8()
        if (remark instanceof GeneralError) return remark

        return new Remark(remark)
      }
    }

    export class SetCode {
      constructor(
        public code: Uint8Array, // Vec<u8>,
      ) {}

      encode(): Uint8Array {
        return mergeArrays([Encoder.vecU8(this.code)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 2]
      }

      dispatchIndex(): [number, number] {
        return SetCode.dispatchIndex()
      }

      static decode(decoder: Decoder): SetCode | GeneralError {
        const code = decoder.vecU8()
        if (code instanceof GeneralError) return code

        return new SetCode(code)
      }
    }

    export class SetCodeWithoutChecks {
      constructor(
        public code: Uint8Array, // Vec<u8>,
      ) {}

      encode(): Uint8Array {
        return mergeArrays([Encoder.vecU8(this.code)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 3]
      }

      dispatchIndex(): [number, number] {
        return SetCodeWithoutChecks.dispatchIndex()
      }

      static decode(decoder: Decoder): SetCodeWithoutChecks | GeneralError {
        const code = decoder.vecU8()
        if (code instanceof GeneralError) return code

        return new SetCodeWithoutChecks(code)
      }
    }

    export class RemarkWithEvent {
      constructor(
        public remark: Uint8Array, // Vec<u8>,
      ) {}

      encode(): Uint8Array {
        return mergeArrays([Encoder.vecU8(this.remark)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 7]
      }

      dispatchIndex(): [number, number] {
        return RemarkWithEvent.dispatchIndex()
      }

      static decode(decoder: Decoder): RemarkWithEvent | GeneralError {
        const remark = decoder.vecU8()
        if (remark instanceof GeneralError) return remark

        return new RemarkWithEvent(remark)
      }
    }
  }
}

export namespace proxy {
  export const PALLET_NAME: string = "proxy"
  export const PALLET_INDEX: number = 40

  export namespace tx {
    export class Proxy {
      constructor(
        public id: MultiAddress,
        public forceProxyType: ProxyType | null, // Option<ProxyType>
        public call: TransactionCall,
      ) {}

      encode(): Uint8Array {
        return mergeArrays([Encoder.any(this.id), Encoder.option(this.forceProxyType), Encoder.any(this.call)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return Proxy.dispatchIndex()
      }

      static decode(decoder: Decoder): Proxy | GeneralError {
        const id = MultiAddress.decode(decoder)
        if (id instanceof GeneralError) return id

        const forceProxyType = decoder.option(ProxyType)
        if (forceProxyType instanceof GeneralError) return forceProxyType

        const call = TransactionCall.decode(decoder)
        if (call instanceof GeneralError) return call

        return new Proxy(id, forceProxyType, call)
      }
    }

    export class AddProxy {
      constructor(
        public id: MultiAddress,
        public proxyType: ProxyType,
        public delay: number, // u32
      ) {}

      encode(): Uint8Array {
        return mergeArrays([Encoder.any(this.id), Encoder.any(this.proxyType), Encoder.u32(this.delay)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 1]
      }

      dispatchIndex(): [number, number] {
        return AddProxy.dispatchIndex()
      }

      static decode(decoder: Decoder): AddProxy | GeneralError {
        const id = decoder.any(MultiAddress)
        if (id instanceof GeneralError) return id

        const proxyType = decoder.any(ProxyType)
        if (proxyType instanceof GeneralError) return proxyType

        const delay = decoder.u32()
        if (delay instanceof GeneralError) return delay

        return new AddProxy(id, proxyType, delay)
      }
    }

    export class RemoveProxy {
      constructor(
        public delegate: MultiAddress,
        public proxyType: ProxyType,
        public delay: number, // u32
      ) {}

      encode(): Uint8Array {
        return mergeArrays([Encoder.any(this.delegate), Encoder.any(this.proxyType), Encoder.u32(this.delay)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 2]
      }

      dispatchIndex(): [number, number] {
        return RemoveProxy.dispatchIndex()
      }

      static decode(decoder: Decoder): RemoveProxy | GeneralError {
        const delegate = decoder.any(MultiAddress)
        if (delegate instanceof GeneralError) return delegate

        const proxyType = decoder.any(ProxyType)
        if (proxyType instanceof GeneralError) return proxyType

        const delay = decoder.u32()
        if (delay instanceof GeneralError) return delay

        return new RemoveProxy(delegate, proxyType, delay)
      }
    }

    export class RemoveProxies {
      constructor() {}

      encode(): Uint8Array {
        return new Uint8Array()
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 3]
      }

      dispatchIndex(): [number, number] {
        return RemoveProxies.dispatchIndex()
      }

      static decode(_decoder: Decoder): RemoveProxies | GeneralError {
        return new RemoveProxies()
      }
    }

    export class CreatePure {
      constructor(
        public proxyType: ProxyType,
        public delay: number, // u32
        public index: number, // u16
      ) {}

      encode(): Uint8Array {
        return mergeArrays([Encoder.any(this.proxyType), Encoder.u32(this.delay), Encoder.u16(this.index)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 4]
      }

      dispatchIndex(): [number, number] {
        return CreatePure.dispatchIndex()
      }

      static decode(decoder: Decoder): CreatePure | GeneralError {
        const proxyType = decoder.any(ProxyType)
        if (proxyType instanceof GeneralError) return proxyType

        const delay = decoder.u32()
        if (delay instanceof GeneralError) return delay

        const index = decoder.u16()
        if (index instanceof GeneralError) return index

        return new CreatePure(proxyType, delay, index)
      }
    }

    export class KillPure {
      constructor(
        public spawner: MultiAddress,
        public proxyType: ProxyType,
        public index: number, // u16
        public height: number, // Compact<u32>
        public extIndex: number, // Compact<u32>
      ) {}

      encode(): Uint8Array {
        return mergeArrays([
          Encoder.any(this.spawner),
          Encoder.any(this.proxyType),
          Encoder.u16(this.index),
          Encoder.u32(this.height, true),
          Encoder.u32(this.extIndex, true),
        ])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 5]
      }

      dispatchIndex(): [number, number] {
        return KillPure.dispatchIndex()
      }

      static decode(decoder: Decoder): KillPure | GeneralError {
        const spawner = decoder.any(MultiAddress)
        if (spawner instanceof GeneralError) return spawner

        const proxyType = decoder.any(ProxyType)
        if (proxyType instanceof GeneralError) return proxyType

        const index = decoder.u16()
        if (index instanceof GeneralError) return index

        const height = decoder.u32(true)
        if (height instanceof GeneralError) return height

        const extIndex = decoder.u32(true)
        if (extIndex instanceof GeneralError) return extIndex

        return new KillPure(spawner, proxyType, index, height, extIndex)
      }
    }
  }
}

export namespace multisig {
  export const PALLET_NAME: string = "multisig"
  export const PALLET_INDEX: number = 34

  export namespace types {
    export class Timepoint {
      constructor(
        public height: number, // u32
        public index: number, // u32
      ) {}

      encode(): Uint8Array {
        return mergeArrays([Encoder.u32(this.height), Encoder.u32(this.index)])
      }

      static decode(decoder: Decoder): Timepoint | GeneralError {
        const height = decoder.u32()
        if (height instanceof GeneralError) return height

        const index = decoder.u32()
        if (index instanceof GeneralError) return index

        return new Timepoint(height, index)
      }
    }
  }

  export namespace tx {
    export class AsMultiThreshold1 {
      constructor(
        public otherSignatories: AccountId[], // Vec<AccountId>
        public call: TransactionCall,
      ) {}

      encode(): Uint8Array {
        return mergeArrays([Encoder.vec(this.otherSignatories), Encoder.any(this.call)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return AsMultiThreshold1.dispatchIndex()
      }

      static decode(decoder: Decoder): AsMultiThreshold1 | GeneralError {
        const otherSignatories = decoder.vec(AccountId)
        if (otherSignatories instanceof GeneralError) return otherSignatories

        const call = decoder.any(TransactionCall)
        if (call instanceof GeneralError) return call

        return new AsMultiThreshold1(otherSignatories, call)
      }
    }

    export class AsMulti {
      constructor(
        public threshold: number, // u16
        public otherSignatories: AccountId[], // Vec<AccountId>
        public maybeTimepoint: multisig.types.Timepoint | null, // Option<Timepoint>
        public call: TransactionCall,
        public maxWeight: Weight,
      ) {}

      encode(): Uint8Array {
        return mergeArrays([
          Encoder.u16(this.threshold),
          Encoder.vec(this.otherSignatories),
          Encoder.option(this.maybeTimepoint),
          Encoder.any(this.call),
          Encoder.any(this.maxWeight),
        ])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 1]
      }

      dispatchIndex(): [number, number] {
        return AsMulti.dispatchIndex()
      }

      static decode(decoder: Decoder): AsMulti | GeneralError {
        const threshold = decoder.u16()
        if (threshold instanceof GeneralError) return threshold

        const otherSignatories = decoder.vec(AccountId)
        if (otherSignatories instanceof GeneralError) return otherSignatories

        const maybeTimepoint = decoder.option(multisig.types.Timepoint)
        if (maybeTimepoint instanceof GeneralError) return maybeTimepoint

        const call = decoder.any(TransactionCall)
        if (call instanceof GeneralError) return call

        const maxWeight = decoder.any(Weight)
        if (maxWeight instanceof GeneralError) return maxWeight

        return new AsMulti(threshold, otherSignatories, maybeTimepoint, call, maxWeight)
      }
    }

    export class ApproveAsMulti {
      constructor(
        public threshold: number, // u16
        public otherSignatories: AccountId[], // Vec<AccountId>
        public maybeTimepoint: multisig.types.Timepoint | null, // Option<Timepoint>
        public callHash: H256,
        public maxWeight: Weight,
      ) {}

      encode(): Uint8Array {
        return mergeArrays([
          Encoder.u16(this.threshold),
          Encoder.vec(this.otherSignatories),
          Encoder.option(this.maybeTimepoint),
          Encoder.any(this.callHash),
          Encoder.any(this.maxWeight),
        ])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 2]
      }

      dispatchIndex(): [number, number] {
        return ApproveAsMulti.dispatchIndex()
      }

      static decode(decoder: Decoder): ApproveAsMulti | GeneralError {
        const threshold = decoder.u16()
        if (threshold instanceof GeneralError) return threshold

        const otherSignatories = decoder.vec(AccountId)
        if (otherSignatories instanceof GeneralError) return otherSignatories

        const maybeTimepoint = decoder.option(multisig.types.Timepoint)
        if (maybeTimepoint instanceof GeneralError) return maybeTimepoint

        const callHash = decoder.any(H256)
        if (callHash instanceof GeneralError) return callHash

        const maxWeight = decoder.any(Weight)
        if (maxWeight instanceof GeneralError) return maxWeight

        return new ApproveAsMulti(threshold, otherSignatories, maybeTimepoint, callHash, maxWeight)
      }
    }

    export class CancelAsMulti {
      constructor(
        public threshold: number, // u16
        public otherSignatories: AccountId[], // Vec<AccountId>
        public timepoint: multisig.types.Timepoint,
        public callHash: H256,
      ) {}

      encode(): Uint8Array {
        return mergeArrays([
          Encoder.u16(this.threshold),
          Encoder.vec(this.otherSignatories),
          Encoder.any(this.timepoint),
          Encoder.any(this.callHash),
        ])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 3]
      }

      dispatchIndex(): [number, number] {
        return CancelAsMulti.dispatchIndex()
      }

      static decode(decoder: Decoder): CancelAsMulti | GeneralError {
        const threshold = decoder.u16()
        if (threshold instanceof GeneralError) return threshold

        const otherSignatories = decoder.vec(AccountId)
        if (otherSignatories instanceof GeneralError) return otherSignatories

        const maybeTimepoint = decoder.any(multisig.types.Timepoint)
        if (maybeTimepoint instanceof GeneralError) return maybeTimepoint

        const callHash = decoder.any(H256)
        if (callHash instanceof GeneralError) return callHash

        return new CancelAsMulti(threshold, otherSignatories, maybeTimepoint, callHash)
      }
    }
  }
}

export namespace balances {
  export const PALLET_NAME: string = "balances"
  export const PALLET_INDEX: number = 6

  export namespace tx {
    export class TransferAllowDeath {
      constructor(
        public dest: MultiAddress,
        public value: BN,
      ) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "transferAllowDeath"

      encode(): Uint8Array {
        return mergeArrays([Encoder.any(this.dest), Encoder.u128(this.value, true)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 0]
      }

      dispatchIndex(): [number, number] {
        return TransferAllowDeath.dispatchIndex()
      }

      static decode(decoder: Decoder): TransferAllowDeath | GeneralError {
        const dest = MultiAddress.decode(decoder)
        if (dest instanceof GeneralError) return dest

        const value = decoder.u128(true)
        if (value instanceof GeneralError) return value

        return new TransferAllowDeath(dest, value)
      }
    }

    export class TransferKeepAlive {
      constructor(
        public dest: MultiAddress,
        public value: BN,
      ) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "transferKeepAlive"

      encode(): Uint8Array {
        return mergeArrays([Encoder.any(this.dest), Encoder.u128(this.value, true)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 3]
      }

      dispatchIndex(): [number, number] {
        return TransferKeepAlive.dispatchIndex()
      }

      static decode(decoder: Decoder): TransferKeepAlive | GeneralError {
        const dest = MultiAddress.decode(decoder)
        if (dest instanceof GeneralError) return dest

        const value = decoder.u128(true)
        if (value instanceof GeneralError) return value

        return new TransferKeepAlive(dest, value)
      }
    }

    export class TransferAll {
      constructor(
        public dest: MultiAddress,
        public keepAlive: boolean,
      ) {}
      static PALLET_NAME: string = PALLET_NAME
      static CALL_NAME: string = "transferAll"

      encode(): Uint8Array {
        return mergeArrays([Encoder.any(this.dest), Encoder.bool(this.keepAlive)])
      }

      static dispatchIndex(): [number, number] {
        return [PALLET_INDEX, 4]
      }

      dispatchIndex(): [number, number] {
        return TransferAll.dispatchIndex()
      }

      static decode(decoder: Decoder): TransferAll | GeneralError {
        const dest = MultiAddress.decode(decoder)
        if (dest instanceof GeneralError) return dest

        const keepAlive = decoder.bool()
        if (keepAlive instanceof GeneralError) return keepAlive

        return new TransferAll(dest, keepAlive)
      }
    }
  }
}
