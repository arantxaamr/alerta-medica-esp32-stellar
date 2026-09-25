# Pulso — monorepo

Sistema de alerta y seguimiento para emergencias médicas familiares (ESP32 + Pollar + Stellar). Demo piloto CDMX.

> Una alerta en correo o panel **no** equivale a un reporte recibido por el 911. Un familiar designado llama al 911 cuando corresponda.

## Estructura

```text
apps/web/          Next.js (API + paneles persona/familiar)
firmware/          Arduino ESP32-DevKit V1 (pulsador + LED)
contracts/         Contrato Soroban (Stellar testnet)
PDR_TRD_*.md       Guía de producto y arquitectura
```

## Stack

- Next.js + TypeScript + Prisma
- Supabase (PostgreSQL)
- Vercel
- Pollar (OTP por correo)
- Resend (correo transaccional)
- Stellar testnet (Soroban)
- Arduino (ESP32)

## Setup rápido (`apps/web`)

1. Copia variables de entorno:

```bash
cp apps/web/.env.example apps/web/.env.local
```

2. Completa `DATABASE_URL` (Supabase), claves Pollar, Resend y Stellar cuando las tengas.

3. Instala y prepara Prisma:

```bash
cd apps/web
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

4. Desarrollo local:

```bash
npm run dev
# o desde la raíz:
# npm run dev
```

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Vercel

En el proyecto de Vercel, configura **Root Directory** = `apps/web`. Variables de entorno desde `.env.example`.

## Auth (Pollar + sesión Pulso)

1. Crea una app en [dashboard.pollar.xyz](https://dashboard.pollar.xyz) (testnet).
2. Copia `NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY` y `POLLAR_SECRET_KEY` a `apps/web/.env.local`.
3. Sin claves aún, en `/entrar` usa **Acceso demo** (persona / familiar / admin).

Roles por correo: `ADMIN_EMAILS`, `FAMILY_EMAILS` (lista separada por comas).

## Stellar testnet (Pulso Anchor)

Contrato Soroban desplegado e inicializado con la cuenta `pulso-admin`.

| Recurso | ID / enlace |
|--------|-------------|
| **Contract ID** | `CBOCHL4EFIVNPLVYXP6Y352CXAKDZ5PM53PTHJ2OR57UL7E2ZKGK273X` |
| **Contrato (Stellar Expert)** | [Ver en testnet](https://stellar.expert/explorer/testnet/contract/CBOCHL4EFIVNPLVYXP6Y352CXAKDZ5PM53PTHJ2OR57UL7E2ZKGK273X) |
| **Admin (`pulso-admin`)** | `GANLLWK2VI5O7FQXPJMGH55A6SYVUGT66GLSUZICPLGSIN6FHC73I2GE` |
| **Cuenta admin (Stellar Expert)** | [Ver en testnet](https://stellar.expert/explorer/testnet/account/GANLLWK2VI5O7FQXPJMGH55A6SYVUGT66GLSUZICPLGSIN6FHC73I2GE) |

Detalles de build/deploy: [`contracts/README.md`](./contracts/README.md).

## Pendiente / aplazado

- **ESP32 + Vercel + simulacro:** ver guía detallada [`TICKETS_PENDIENTES.md`](./TICKETS_PENDIENTES.md) (T03, T06–T08 E2E, T15–T17).

Documentos del piloto en la app: `/protocolo` (T01), `/privacidad` (T02). Chequeo: `/chequeo` (T12).

## Documentación

- [`PDR_TRD_emergencias_MX.md`](./PDR_TRD_emergencias_MX.md) — producto y arquitectura  
- [`TICKETS_PENDIENTES.md`](./TICKETS_PENDIENTES.md) — tickets abiertos y plan ESP32 end-to-end  
- [`contracts/README.md`](./contracts/README.md) — Soroban testnet  
