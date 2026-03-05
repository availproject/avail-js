import type { Compact, u8, u16, u32, u64, Vec, Enum, Struct } from "@polkadot/types-codec"
import type { Hash, Header } from "@polkadot/types/interfaces/runtime"

export interface DataLookupItem extends Struct {
  readonly appId: Compact<u32>
  readonly start: Compact<u32>
}

export interface KateCommitment extends Struct {
  readonly rows: Compact<u16>
  readonly cols: Compact<u16>
  readonly commitment: Vec<u8>
  readonly dataRoot: Hash
}

export interface V4CompactDataLookup {
  readonly size: Compact<u32>
  readonly index: Vec<DataLookupItem>
  readonly rowsPerTx: Vec<u16>
}

export interface V4HeaderExtension extends Struct {
  readonly appLookup: V4CompactDataLookup
  readonly commitment: KateCommitment
}

export interface KzgHeader extends Enum {
  readonly isV4: boolean
  readonly asV4: V4HeaderExtension
}

export interface FriBlobCommitment extends Struct {
  readonly sizeBytes: u64
  readonly commitment: Hash
}

export interface FriParamsVersion extends Enum {
  readonly isV0: boolean
}

export interface FriV1HeaderExtension extends Struct {
  readonly blobs: Vec<FriBlobCommitment>
  readonly dataRoot: Hash
  readonly paramsVersion: FriParamsVersion
}

export interface FriHeader extends Enum {
  readonly isV1: boolean
  readonly asV1: FriV1HeaderExtension
}

export interface HeaderExtension extends Enum {
  readonly isKzg: boolean
  readonly asKzg: KzgHeader
  readonly isFri: boolean
  readonly asFri: FriHeader
}

export interface AvailHeader extends Header {
  readonly extension: HeaderExtension
}
