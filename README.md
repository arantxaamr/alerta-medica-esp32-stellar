# Pulso — monorepo

Sistema de alerta y seguimiento para emergencias médicas familiares (ESP32 + Pollar + Stellar). Demo piloto CDMX.

> Una alerta en correo o panel **no** equivale a un reporte recibido por el 911. Un familiar designado llama al 911 cuando corresponda.

## Estructura

El flujo de acceso por correo, consentimiento y vínculos familiares está descrito en [ACCESO_Y_VINCULOS.md](ACCESO_Y_VINCULOS.md).

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

2. Completa `DATABASE_URL` (Supabase), Pollar, Resend, `SESSION_SECRET` y `ADMIN_EMAILS`. Las claves Stellar se usarán en una etapa posterior.

3. Instala y prepara Prisma:

```bash
cd apps/web
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec prisma db push
```

4. Desarrollo local:

```bash
pnpm dev
# o desde la raíz:
# npm run dev
```

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Vercel

En el proyecto de Vercel, configura **Root Directory** = `apps/web`. Variables de entorno desde `.env.example`. Autoriza el dominio HTTPS de Vercel en la aplicación Pollar antes de probar el acceso allí.

## Modo simulacro

Las alertas aún corren en **modo simulación**. El acceso puede registrar participantes reales que acepten el consentimiento del piloto, pero todavía no debe presentarse como servicio operativo de emergencias.

## Documentación y demostración

- [PDR y TRD del piloto](./PDR_TRD_emergencias_MX.md)
- [Especificación de landing e identidad](./LANDING_PULSO.md)
- [White paper y canvas de negocio](./WHITEPAPER_PULSO.md)

La ruta `/` presenta Pulso a familias y personas cuidadoras; `/demo` es una **vista previa temporal** de las dos pulsaciones físicas y la confirmación familiar posterior. Una sola pulsación no crea alerta. La demostración final deberá usar la ESP32 real, que se conectará después de terminar la landing. La vista previa actual no crea incidentes, envía correos ni contacta al 911.
