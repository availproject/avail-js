## Vocabulary & Structure

### Extrinsics

Signed Extrinsic

```
                Extrinsic Signature                            Extrinsic Call
|--------------------------------------------------|------------------------------------|
| MultiAddress | MultiSignature | TransactionExtra | Pallet Id | Variant Id | Call Data |
```

Extrinsic

```
            Extrinsic Signature (Optional)                     Extrinsic Call
|--------------------------------------------------|------------------------------------|
| MultiAddress | MultiSignature | TransactionExtra | Pallet Id | Variant Id | Call Data |
```

Raw Extrinsic

```
                                        Extrinsic
|---------------------------------------------------------------------------------------|
|                                         Bytes                                         |
```

```
            Extrinsic Signature (Optional)                     Extrinsic Call
|--------------------------------------------------|------------------------------------|
| MultiAddress | MultiSignature | TransactionExtra |                Bytes               |
```

Decoded Signed Extrinsic

```
                Extrinsic Signature                            Extrinsic Call
|--------------------------------------------------|------------------------------------|
| MultiAddress | MultiSignature | TransactionExtra |                  T                 |
```

Decoded Extrinsic

```
            Extrinsic Signature (Optional)                     Extrinsic Call
|--------------------------------------------------|------------------------------------|
| MultiAddress | MultiSignature | TransactionExtra |                  T                 |
```

### Extrinsics from Block

Metadata

```
                        Metadata                 
|--------------------------------------------------------|
| Tx Hash | Tx Index | Pallet Id | Variant Id | Block Id |
```

BlockSignedExtrinsic

```
                         Additional                         Decoded Signed Extrinsic
|----------|-----------------------------------------|-----------------------------------|
| Metadata | Ss58Address (optional) | App Id | Nonce |         Signature + Call          |
```

BlockExtrinsic

```
                   Additional                         Decoded Extrinsic 
|----------|------------------------|----------------------------------------------------|
| Metadata | Ss58Address (optional) |            Signature (optional) + Call             |
```

BlockRawExtrinsic

```
                          Signature (optional)                      Extrinsic/Call/None
|----------|-----------------------------------------------------|------------------------|
| Metadata | Ss58Address (optional) | App Id | Nonce | Mortality |     Bytes (optional)   |
```

## Caveats

TODO
