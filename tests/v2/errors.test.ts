import { ErrorCode } from "../../src/errors/codes"
import {
  DecodeError,
  NotFoundError,
  RpcError,
  TimeoutError,
  TransportError,
  ValidationError,
} from "../../src/errors/sdk-error"

describe("v2 error hierarchy", () => {
  it("assigns stable error codes", () => {
    expect(new ValidationError("invalid").code).toBe(ErrorCode.Validation)
    expect(new TransportError("transport").code).toBe(ErrorCode.Transport)
    expect(new RpcError("rpc").code).toBe(ErrorCode.Rpc)
    expect(new NotFoundError("missing").code).toBe(ErrorCode.NotFound)
    expect(new TimeoutError("timeout").code).toBe(ErrorCode.Timeout)
    expect(new DecodeError("decode").code).toBe(ErrorCode.Decode)
  })
})
