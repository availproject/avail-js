import { assertEq } from "."
import { BN } from "../src/sdk/types"
import { Decoder, Encoder } from "../src/sdk/types/scale"
import { Hex } from "../src/sdk/utils"

export default function runTests() {
  encode_decode_u8()
  encode_decode_u16()
  encode_decode_u32()
  encode_decode_u64()
  encode_decode_u128()
}

function encode_decode_u8() {
  const U8_MIN = 0x00
  const U8_MAX = 0xff
  const U8_AVG = Math.floor(U8_MAX / 2)

  // Encode U8
  assertEq(Hex.encode(Encoder.u8(U8_MIN)), "0x00")
  assertEq(Hex.encode(Encoder.u8(U8_AVG - 1)), "0x7e")
  assertEq(Hex.encode(Encoder.u8(U8_AVG + 1)), "0x80")
  assertEq(Hex.encode(Encoder.u8(U8_MAX)), "0xff")

  // Encode U8 Compact
  assertEq(Hex.encode(Encoder.u8(U8_MIN, true)), "0x00")
  assertEq(Hex.encode(Encoder.u8(U8_AVG - 1, true)), "0xf901")
  assertEq(Hex.encode(Encoder.u8(U8_AVG + 1, true)), "0x0102")
  assertEq(Hex.encode(Encoder.u8(U8_MAX, true)), "0xfd03")

  // Decode U8
  assertEq(Decoder.fromUnsafe("0x00").u8(), U8_MIN)
  assertEq(Decoder.fromUnsafe("0x7e").u8(), U8_AVG - 1)
  assertEq(Decoder.fromUnsafe("0x80").u8(), U8_AVG + 1)
  assertEq(Decoder.fromUnsafe("0xff").u8(), U8_MAX)

  // Decode U8 Compact
  assertEq(Decoder.fromUnsafe("0x00").u8(true), U8_MIN)
  assertEq(Decoder.fromUnsafe("0xf901").u8(true), U8_AVG - 1)
  assertEq(Decoder.fromUnsafe("0x0102").u8(true), U8_AVG + 1)
  assertEq(Decoder.fromUnsafe("0xfd03").u8(true), U8_MAX)
}

function encode_decode_u16() {
  const U16_MIN = 0x0000
  const U16_MAX = 0xffff
  const U16_AVG = Math.floor(U16_MAX / 2)

  // Encode U16
  assertEq(Hex.encode(Encoder.u16(U16_MIN)), "0x0000")
  assertEq(Hex.encode(Encoder.u16(U16_AVG - 1)), "0xfe7f")
  assertEq(Hex.encode(Encoder.u16(U16_AVG + 1)), "0x0080")
  assertEq(Hex.encode(Encoder.u16(U16_MAX)), "0xffff")

  // Encode U16 Compact
  assertEq(Hex.encode(Encoder.u16(U16_MIN, true)), "0x00")
  assertEq(Hex.encode(Encoder.u16(U16_AVG - 1, true)), "0xfaff0100")
  assertEq(Hex.encode(Encoder.u16(U16_AVG + 1, true)), "0x02000200")
  assertEq(Hex.encode(Encoder.u16(U16_MAX, true)), "0xfeff0300")

  // Decode U16
  assertEq(Decoder.fromUnsafe("0x0000").u16(), U16_MIN)
  assertEq(Decoder.fromUnsafe("0xfe7f").u16(), U16_AVG - 1)
  assertEq(Decoder.fromUnsafe("0x0080").u16(), U16_AVG + 1)
  assertEq(Decoder.fromUnsafe("0xffff").u16(), U16_MAX)

  // Decode U16 Compact
  assertEq(Decoder.fromUnsafe("0x00").u16(true), U16_MIN)
  assertEq(Decoder.fromUnsafe("0xfaff0100").u16(true), U16_AVG - 1)
  assertEq(Decoder.fromUnsafe("0x02000200").u16(true), U16_AVG + 1)
  assertEq(Decoder.fromUnsafe("0xfeff0300").u16(true), U16_MAX)
}

function encode_decode_u32() {
  const U32_MIN = 0x00000000
  const U32_MAX = 0xffffffff
  const U32_AVG = Math.floor(U32_MAX / 2)

  // Encode U32
  assertEq(Hex.encode(Encoder.u32(U32_MIN)), "0x00000000")
  assertEq(Hex.encode(Encoder.u32(U32_AVG - 1)), "0xfeffff7f")
  assertEq(Hex.encode(Encoder.u32(U32_AVG + 1)), "0x00000080")
  assertEq(Hex.encode(Encoder.u32(U32_MAX)), "0xffffffff")

  // Encode U32 Compact
  assertEq(Hex.encode(Encoder.u32(U32_MIN, true)), "0x00")
  assertEq(Hex.encode(Encoder.u32(U32_AVG - 1, true)), "0x03feffff7f")
  assertEq(Hex.encode(Encoder.u32(U32_AVG + 1, true)), "0x0300000080")
  assertEq(Hex.encode(Encoder.u32(U32_MAX, true)), "0x03ffffffff")

  // Decode U32
  assertEq(Decoder.fromUnsafe("0x00000000").u32(), U32_MIN)
  assertEq(Decoder.fromUnsafe("0xfeffff7f").u32(), U32_AVG - 1)
  assertEq(Decoder.fromUnsafe("0x00000080").u32(), U32_AVG + 1)
  assertEq(Decoder.fromUnsafe("0xffffffff").u32(), U32_MAX)

  // Decode U32 Compact
  assertEq(Decoder.fromUnsafe("0x00").u32(true), U32_MIN)
  assertEq(Decoder.fromUnsafe("0x03feffff7f").u32(true), U32_AVG - 1)
  assertEq(Decoder.fromUnsafe("0x0300000080").u32(true), U32_AVG + 1)
  assertEq(Decoder.fromUnsafe("0x03ffffffff").u32(true), U32_MAX)
}

function encode_decode_u64() {
  const ONE = new BN(1)
  const U64_MIN = new BN("0")
  const U64_MAX = new BN("18446744073709551615")
  const U64_AVG = new BN("9223372036854775807")

  // Encode U64
  assertEq(Hex.encode(Encoder.u64(U64_MIN)), "0x0000000000000000")
  assertEq(Hex.encode(Encoder.u64(U64_AVG.sub(ONE))), "0xfeffffffffffff7f")
  assertEq(Hex.encode(Encoder.u64(U64_AVG.add(ONE))), "0x0000000000000080")
  assertEq(Hex.encode(Encoder.u64(U64_MAX)), "0xffffffffffffffff")

  // Encode U64 Compact
  assertEq(Hex.encode(Encoder.u64(U64_MIN, true)), "0x00")
  assertEq(Hex.encode(Encoder.u64(U64_AVG.sub(ONE), true)), "0x13feffffffffffff7f")
  assertEq(Hex.encode(Encoder.u64(U64_AVG.add(ONE), true)), "0x130000000000000080")
  assertEq(Hex.encode(Encoder.u64(U64_MAX, true)), "0x13ffffffffffffffff")

  // Decode U64
  assertEq(Decoder.fromUnsafe("0x0000000000000000").u64().toString(), U64_MIN.toString())
  assertEq(Decoder.fromUnsafe("0xfeffffffffffff7f").u64().toString(), U64_AVG.sub(ONE).toString())
  assertEq(Decoder.fromUnsafe("0x0000000000000080").u64().toString(), U64_AVG.add(ONE).toString())
  assertEq(Decoder.fromUnsafe("0xffffffffffffffff").u64().toString(), U64_MAX.toString())

  // Decode U64 Compact
  assertEq(Decoder.fromUnsafe("0x00").u64(true).toString(), U64_MIN.toString())
  assertEq(Decoder.fromUnsafe("0x13feffffffffffff7f").u64(true).toString(), U64_AVG.sub(ONE).toString())
  assertEq(Decoder.fromUnsafe("0x130000000000000080").u64(true).toString(), U64_AVG.add(ONE).toString())
  assertEq(Decoder.fromUnsafe("0x13ffffffffffffffff").u64(true).toString(), U64_MAX.toString())
}

function encode_decode_u128() {
  const ONE = new BN(1)
  const U128_MIN = new BN("0")
  const U128_MAX = new BN("340282366920938463463374607431768211455")
  const U128_AVG = new BN("170141183460469231731687303715884105727")

  // Encode U128
  assertEq(Hex.encode(Encoder.u128(U128_MIN)), "0x00000000000000000000000000000000")
  assertEq(Hex.encode(Encoder.u128(U128_AVG.sub(ONE))), "0xfeffffffffffffffffffffffffffff7f")
  assertEq(Hex.encode(Encoder.u128(U128_AVG.add(ONE))), "0x00000000000000000000000000000080")
  assertEq(Hex.encode(Encoder.u128(U128_MAX)), "0xffffffffffffffffffffffffffffffff")

  // Encode U128 Compact
  assertEq(Hex.encode(Encoder.u128(U128_MIN, true)), "0x00")
  assertEq(Hex.encode(Encoder.u128(U128_AVG.sub(ONE), true)), "0x33feffffffffffffffffffffffffffff7f")
  assertEq(Hex.encode(Encoder.u128(U128_AVG.add(ONE), true)), "0x3300000000000000000000000000000080")
  assertEq(Hex.encode(Encoder.u128(U128_MAX, true)), "0x33ffffffffffffffffffffffffffffffff")

  // Decode U128
  assertEq(Decoder.fromUnsafe("0x00000000000000000000000000000000").u128().toString(), U128_MIN.toString())
  assertEq(Decoder.fromUnsafe("0xfeffffffffffffffffffffffffffff7f").u128().toString(), U128_AVG.sub(ONE).toString())
  assertEq(Decoder.fromUnsafe("0x00000000000000000000000000000080").u128().toString(), U128_AVG.add(ONE).toString())
  assertEq(Decoder.fromUnsafe("0xffffffffffffffffffffffffffffffff").u128().toString(), U128_MAX.toString())

  // Decode U128 Compact
  assertEq(Decoder.fromUnsafe("0x00").u128(true).toString(), U128_MIN.toString())
  assertEq(
    Decoder.fromUnsafe("0x33feffffffffffffffffffffffffffff7f").u128(true).toString(),
    U128_AVG.sub(ONE).toString(),
  )
  assertEq(
    Decoder.fromUnsafe("0x3300000000000000000000000000000080").u128(true).toString(),
    U128_AVG.add(ONE).toString(),
  )
  assertEq(Decoder.fromUnsafe("0x33ffffffffffffffffffffffffffffffff").u128(true).toString(), U128_MAX.toString())
}
