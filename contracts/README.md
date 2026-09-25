# Contrato Soroban — Pulso Anchor

Workspace generado con `stellar contract init`.

## Funciones

- `initialize(admin)`
- `record_event(case_key, seq, event_code, server_received_at_unix, commitment)`
- `get_case_state(case_key)`

Códigos: `1=OPENED`, `2=FAMILY_ACK`, `3=CLOSED`, `4=FALSE_ALARM`.

Sin datos personales en cadena.

## Anclaje desde la app (T13/T14)

Al abrir, acusar o cerrar una alerta, el backend encola un `ChainAnchor` e intenta
`record_event` con la cuenta `pulso-admin`. Si Stellar falla, la alerta y el correo
siguen; el GET del incidente reintenta anclajes pendientes.

En `/ayuda` y `/familiar/alerta/[id]` aparecen enlaces a Stellar Expert cuando hay `tx_hash`.

## Build / test

```bash
cd contracts/pulso_anchor
cargo test -p hello-world
stellar contract build
```

## Deploy actual (testnet)

| Recurso | Valor |
|--------|--------|
| **Contract ID** | `CBOCHL4EFIVNPLVYXP6Y352CXAKDZ5PM53PTHJ2OR57UL7E2ZKGK273X` |
| **Stellar Expert (contrato)** | https://stellar.expert/explorer/testnet/contract/CBOCHL4EFIVNPLVYXP6Y352CXAKDZ5PM53PTHJ2OR57UL7E2ZKGK273X |
| **Admin** | `GANLLWK2VI5O7FQXPJMGH55A6SYVUGT66GLSUZICPLGSIN6FHC73I2GE` (`pulso-admin`) |
| **Stellar Expert (admin)** | https://stellar.expert/explorer/testnet/account/GANLLWK2VI5O7FQXPJMGH55A6SYVUGT66GLSUZICPLGSIN6FHC73I2GE |

## Redeploy (si hace falta)

```bash
stellar keys generate pulso-admin --network testnet --fund
stellar contract deploy --wasm target/wasm32v1-none/release/hello_world.wasm --source pulso-admin --network testnet
stellar contract invoke --id CONTRACT_ID --source pulso-admin --network testnet -- initialize --admin $(stellar keys address pulso-admin)
```

Copia `STELLAR_SECRET_KEY` y `STELLAR_CONTRACT_ID` a `apps/web/.env.local`.
