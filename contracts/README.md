# Contrato Soroban — Pulso Anchor

Workspace generado con `stellar contract init`.

## Funciones

- `initialize(admin)`
- `record_event(case_key, seq, event_code, server_received_at_unix, commitment)`
- `get_case_state(case_key)`

Códigos: `1=OPENED`, `2=FAMILY_ACK`, `3=CLOSED`, `4=FALSE_ALARM`.

Sin datos personales en cadena.

## Build / test

```bash
cd contracts/pulso_anchor
cargo test -p hello-world
stellar contract build
```

## Deploy testnet (cuando tengas cuenta fondeada)

```bash
stellar keys generate pulso-admin --network testnet --fund
stellar contract deploy --wasm target/wasm32v1-none/release/hello_world.wasm --source pulso-admin --network testnet
stellar contract invoke --id CONTRACT_ID --source pulso-admin --network testnet -- initialize --admin $(stellar keys address pulso-admin)
```

Copia `STELLAR_SECRET_KEY` y `STELLAR_CONTRACT_ID` a `apps/web/.env.local`.
