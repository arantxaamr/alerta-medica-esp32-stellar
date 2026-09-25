# SOS desde el teléfono (testers) — sin ESP32

Rama: `feature/phone-sos-pwa`
Objetivo: que un usuario tester pida ayuda a familiares desde Android **sin hardware**.

## Flujo

1. Usuario inicia sesión → `/inicio`
2. Toca **Necesito ayuda** → `/ayuda`
3. Confirma **Sí, pedir ayuda ahora**
4. Familiares verificados reciben correo → `/familiar/alerta/{id}`

## Instalar en Android (PWA / atajo)

URL de preview/producción actual (equipo Elias): **https://pulso-web-nu.vercel.app**

1. Abre esa URL en **Chrome** (HTTPS).
2. Menú ⋮ → **Instalar app** o **Añadir a pantalla de inicio**.
3. En `/inicio` también verás la tarjeta «Fija Pulso en tu teléfono».
4. Opcional: mantén pulsado el icono **Pulso** → atajo **Necesito ayuda** (definido en el web manifest).

> Nota: el proyecto Vercel es `pulso-web` (CLI). Si otra persona despliega el front en otro proyecto, coordinen la URL canónica y `NEXT_PUBLIC_APP_URL`.

## Pollar en Vercel (si dice «No se pudo cargar Pollar»)

Pollar solo acepta orígenes autorizados. `http://localhost:3000` suele estar permitido; el dominio de Vercel **no**.

1. Entra a [dashboard.pollar.xyz](https://dashboard.pollar.xyz)
2. En tu app → orígenes / dominios permitidos (Allowed origins / domains)
3. Añade: `https://pulso-web-nu.vercel.app`
4. Guarda y recarga `/entrar` (o pulsa **Reintentar**)

Sin ese paso, la API de config de Pollar responde **403** y el login OTP no carga.

## Qué queda para después (widget nativo)

**v1 en el repo:** [`apps/android/`](../apps/android/) — widget rojo 2×2 que abre `/ayuda`.

Spec y pendientes (TWA, release firmado, QA en dispositivo):
[`docs/T18_ANDROID_WIDGET.md`](./T18_ANDROID_WIDGET.md)

## ESP32

Queda **en pausa** en `feature/esp32-device-integration`. El MVP de alerta familiar usa el teléfono.
