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

## Modo simulacro

Por defecto el producto corre en **modo prueba** (identidad y domicilio de demo). El paso a datos reales queda para cuando el producto madure (consentimiento, aviso de privacidad y tickets T01–T02).

## Documentación y demostración

- [PDR y TRD del piloto](./PDR_TRD_emergencias_MX.md)
- [Especificación de landing e identidad](./LANDING_PULSO.md)
- [White paper y canvas de negocio](./WHITEPAPER_PULSO.md)

La ruta `/` presenta Pulso a familias y personas cuidadoras; `/demo` simula la pulsación y la confirmación familiar. La demo no crea incidentes, envía correos ni contacta al 911.
