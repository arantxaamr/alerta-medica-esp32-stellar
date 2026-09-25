# Tickets pendientes y plan de resolución — Pulso

**Estado del documento:** 25 de septiembre de 2026  
**Fuente de criterios:** [`PDR_TRD_emergencias_MX.md`](./PDR_TRD_emergencias_MX.md) §5  
**Repo:** monorepo `apps/web` + `firmware/` + `contracts/`

> Este archivo es la guía operativa de lo que **falta** y cómo resolverlo.  
> Una alerta en Pulso **no** equivale a un reporte recibido por el 911.

---

## 1. Tablero de tickets (estado actual)

| ID | Ticket | Estado | Notas |
|----|--------|--------|-------|
| **T01** | Protocolo familiar CDMX | **Hecho** | `/protocolo`, principal/suplente, 15 min, mensajes |
| **T02** | Aviso de privacidad + matriz de acceso | **Hecho** | `/privacidad`, consent `pulso-kyc-v2` |
| **T03** | Deploy preview en Vercel | **Hecho (piloto)** | `https://pulso-web-nu.vercel.app` (proyecto CLI `pulso-web`); falta ligar Git si se quiere CI |
| **T04** | PostgreSQL / Prisma / seed | **Hecho** | Supabase + schema |
| **T05** | Pollar OTP + roles | **Hecho** | Usuario/familiar Pollar; admin por clave |
| **T06** | Perfil, contactos, dispositivo | **Parcial** | Alta/KYC/contactos OK; ESP32 **pausado** (rama `feature/esp32-device-integration`) |
| **T07** | Firmware ESP32 | **Pausado** | Pivot MVP → SOS teléfono; retomar después |
| **T08** | Ingesta device-events ESP32 | **Pausado** | Flujo **web/teléfono** es el path del MVP |
| **T09** | Cola correos + estados | **Hecho (núcleo)** | Resend + notificaciones; mejorar reintentos UI si hace falta |
| **T10** | Panel familiar + cierre | **Hecho (núcleo)** | Ack, cierre, falsa alarma, protocolo en UI |
| **T11** | Panel usuario + SOS teléfono | **Hecho** | PWA, `/inicio` ayuda, confirmación `/ayuda`, sync Pollar→Pulso |
| **T12** | Chequeo diario `pulso_daily_v1` | **Hecho** | `/chequeo` + APIs + share |
| **T13** | Contrato Soroban testnet | **Hecho** | Desplegado + Expert; eventos vía app |
| **T14** | Anclaje no bloqueante + reintentos | **Hecho** | OPENED / FAMILY_ACK / CLOSED / FALSE_ALARM |
| **T15** | Simulacro E2E (teléfono → aviso → familiar → cadena) | **Pendiente** | Path teléfono listo; falta checklist formal |
| **T18** | Widget nativo Android (APK) | **Pendiente** | Spec completa: [`docs/T18_ANDROID_WIDGET.md`](./docs/T18_ANDROID_WIDGET.md) |
| **T16** | Producción piloto + monitoreo | **Pendiente** | Después del simulacro |
| **T17** | Ubicación opcional | **Después del MVP** | No bloquear |

### Orden recomendado de ataque

```text
1. T11  — SOS teléfono + PWA (rama feature/phone-sos-pwa → merge a main)
2. T03  — Vercel (URL HTTPS; necesaria para instalar PWA en Android)
3. T15  — simulacro E2E teléfono → familiar → Stellar
4. T16  — endurecer piloto
5. T18  — widget nativo Android (si hay tiempo)
6. T06–T08 / T07 — ESP32 solo si se retoma hardware
```

---

## 2. Tickets pendientes (detalle)

### T03 — Preview en Vercel

**Objetivo:** `https://<proyecto>.vercel.app/api/health` responde 200; la app usa las mismas env que local (sin secretos en Git).

**Pasos:**

1. Crear proyecto en Vercel → **Root Directory** = `apps/web`.
2. Conectar el repo GitHub `arantxaamr/alerta-medica-esp32-stellar` (rama `main`).
3. Variables de entorno (Production + Preview), mínimas:
   - `DATABASE_URL` (pooler Supabase IPv4)
   - `SESSION_SECRET` (≥ 32 chars)
   - `NEXT_PUBLIC_APP_URL` = URL de Vercel (sin slash final)
   - `NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY`, `POLLAR_SECRET_KEY`
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TEST_TO` (si aplica)
   - `STELLAR_NETWORK`, `STELLAR_RPC_URL`, `STELLAR_CONTRACT_ID`, `STELLAR_SECRET_KEY`
   - `ADMIN_PASSWORD`, `ADMIN_EMAILS` (si se usa)
   - `DEVICE_EVENT_HMAC_SECRET` o secretos por dispositivo (ver T06)
   - `PULSO_MODE=simulation` en preview
4. Build: `npm install` + `prisma generate` (ya en `package.json` `build`/`postinstall`).
5. Probar: landing, login Pollar, alta, alerta web, link Stellar Expert.
6. Anotar la URL pública: será `API_BASE_URL` del firmware.

**Terminado cuando:** health público OK + un incidente web creado desde la URL de Vercel.

**Bloquea:** prueba real del ESP32 (la placa no puede hablar a `localhost`).

---

### T06 (resto) — Vinculación de dispositivo

**Ya existe:** modelo Prisma `Device` / `DeviceEvent`, KYC usuario, contactos.

**Falta:**

1. Pantalla `/dispositivo` (o sección en `/inicio`):
   - Estado: sin vincular / activo / revocado
   - Última vez visto (`lastSeenAt`)
   - Botón «Generar código de vinculación» (OTP corto, 10 min)
2. API:
   - `POST /api/devices/pair/start` → crea token + (opcional) provisiona `deviceId` + secreto
   - `POST /api/devices/pair/confirm` → asocia a `session.userId`, status `ACTIVE`
   - `GET /api/devices/me` → estado para la UI
   - `POST /api/devices/revoke`
3. Guardar en DB el **secreto HMAC del dispositivo** (cifrado o solo hash + secreto en env de aprovisionamiento — decidir una opción y documentarla). Para el piloto: secreto aleatorio 32 bytes en hex, mostrado **una sola vez** al vincular (como “grábala en el firmware”).
4. Instrucciones de cableado GPIO27 / GND en la misma pantalla.

**Terminado cuando:** usuario con KYC ve dispositivo activo y puede “probar” tras T07/T08.

---

### T08 (resto) — Ingesta `device-events`

Ver §3.4 (especificación completa). Criterio: un POST válido = un incidente; reintento idempotente.

---

### T07 (resto) — Firmware

Ver §3.3. Criterio: pulsación sostenida con Wi‑Fi crea incidente en URL pública; sin Wi‑Fi el LED indica fallo y reintenta.

---

### T15 — Simulacro E2E

**Guion mínimo (2 corridas seguidas sin duplicados):**

1. Usuario en Vercel: login → (si falta) alta KYC → familiar verificado  
2. Opción A: web «Necesito ayuda»  
3. Opción B: pulsación ESP32  
4. Familiar: correo → ack → (opcional) 911 humano en simulacro → cierre  
5. Verificar `tx_hash` en Stellar Expert  
6. Capturas + notas de latencia / fallos  

**Terminado cuando:** dos ejecuciones documentadas (al menos una con botón físico si hay placa).

---

### T16 — Producción piloto

- Secretos solo en Vercel/Supabase  
- Backup DB / retención acordada en `/privacidad`  
- Responsable on-call del piloto  
- `PULSO_MODE` y banners de simulacro claros  
- Monitoreo básico (logs Vercel + fallos Resend/Stellar)

---

### T17 — Ubicación (después)

Permiso explícito en web (geolocalización del teléfono), vigencia corta, solo familiares autorizados. **No** usar IP como ubicación. No es requisito del MVP físico.

---

## 3. Ticket ESP32 end-to-end (T06 + T07 + T08) — guía específica

Este es el bloque “interesante”. Se resuelve como **un solo epic** en tres capas: **vincular → API → firmware**, y se prueba de punta a punta.

### 3.1 Principio de diseño

```text
[Pulsador] → [ESP32] --HTTPS firmado--> [Next.js API]
                                              ├→ Incident + events
                                              ├→ Email Resend (familia)
                                              └→ Stellar record_event (async)
```

- El ESP32 **no** envía correos ni firma Stellar.  
- Credenciales del dispositivo ≠ sesión Pollar ≠ `STELLAR_SECRET_KEY`.  
- Reintentos del mismo `eventId` / `counter` **no** crean un segundo incidente.

### 3.2 Hardware (DevKit V1)

**Materiales**

- 1× ESP32-WROOM-32 en placa DevKit V1  
- 1× pulsador mecánico normalmente abierto (2 terminales útiles)  
- USB para alimentación + Serial 115200  

**Cableado**

```text
GPIO27 (ESP32) ──── terminal A del botón
GND    (ESP32) ──── terminal B del botón
LED integrado típico en GPIO2 (ya usado en el stub)
```

- Modo pin: `INPUT_PULLUP` → reposo HIGH, pulsado LOW.  
- **No** conectar 3V3/5V al botón en este esquema.  
- Si el pulsador tiene 4 patas: identificar con multímetro el par que cierra al pulsar.  
- Confirmar en la serigrafía de **tu** placa que el pin etiquetado es GPIO27.

**Comportamiento de activación (firmware actual + objetivo)**

| Parámetro | Valor piloto | Motivo |
|-----------|--------------|--------|
| Debounce | 40–50 ms | Filtrar rebote |
| Hold | ~1200 ms | Activación deliberada |
| LED al pulsar | ON | Feedback inmediato |
| LED éxito API | 3 parpadeos cortos | Ack local de “servidor recibió” |
| LED error / sin Wi‑Fi | parpadeo lento o patrón distinto | No fingir éxito |

Stub actual: [`firmware/pulso_button/pulso_button.ino`](./firmware/pulso_button/pulso_button.ino).

### 3.3 Firmware (T07) — qué implementar

Archivo: `firmware/pulso_button/pulso_button.ino` (o PlatformIO equivalente).

#### 3.3.1 Configuración (no commitear secretos reales)

```cpp
// secrets.h — LOCAL ONLY, en .gitignore
#define WIFI_SSID     "..."
#define WIFI_PASS     "..."
#define API_BASE_URL  "https://tu-app.vercel.app"  // sin slash final
#define DEVICE_ID     "dev_..."
#define DEVICE_SECRET "hex_o_base64_del_pairing"   // HMAC key
```

Añadir `firmware/**/secrets.h` al `.gitignore`.

#### 3.3.2 Módulos lógicos

1. **Wi‑Fi**  
   - `WiFi.begin` al boot; reintentos con backoff.  
   - Si no hay IP: no enviar; LED patrón “sin red”.

2. **Reloj (opcional)**  
   - NTP (`configTime`) para `devicePressedAtUtc`.  
   - Si falla NTP: omitir el campo; el servidor usa `serverReceivedAtUtc`.

3. **Detección de pulsación**  
   - Mantener debounce + hold del stub.  
   - Al cumplir hold: generar evento **una vez** (`holdSent`).

4. **Identidad del evento**  
   - `counter`: `uint32` o `uint64` monótono en NVS/EEPROM (incrementar en cada alerta aceptada o en cada intento de envío — documentar: **incrementar al aceptar hold**, reutilizar en reintentos).  
   - `eventId`: string único, p.ej. `esp32_` + `DEVICE_ID` + `_` + `counter` (o UUID si hay RNG).

5. **Payload JSON (canónico para firmar)**  
   Orden de campos estable (mismo string que firma el servidor):

   ```json
   {
     "deviceId": "dev_xxx",
     "eventId": "esp32_dev_xxx_42",
     "counter": 42,
     "devicePressedAtUtc": "2026-09-25T13:45:00.000Z"
   }
   ```

   Si no hay NTP, omitir `devicePressedAtUtc` del JSON canónico **y** del body (mismo criterio en firma).

6. **Firma HMAC-SHA256**  
   - `signature = hex(HMAC_SHA256(DEVICE_SECRET, canonical_json))`  
   - Header sugerido: `X-Pulso-Signature: <hex>`  
   - O campo `signature` en el body (elegir uno; el servidor debe coincidir).

7. **HTTPS POST**  
   - `POST {API_BASE_URL}/api/device-events`  
   - `Content-Type: application/json`  
   - TLS: en ESP32 Arduino suele usarse certificado root o, **solo en piloto**, `setInsecure()` documentado como deuda. Preferir root CA si el tiempo alcanza.

8. **Respuesta**  
   - `202/200` + `{ "accepted": true, "incidentId": "..." }` → LED éxito.  
   - `409` duplicado / already accepted → tratar como éxito (idempotencia).  
   - 4xx/5xx / timeout → cola local de reintento (mismo payload) cada N segundos mientras haya energía.

9. **Serial debug**  
   - Loguear Wi‑Fi IP, counter, HTTP code (nunca el secret).

#### 3.3.3 Criterios de aceptación T07

- [ ] Pulsación corta (&lt; hold) no dispara.  
- [ ] Pulsación ≥ hold con Wi‑Fi → HTTP 2xx y LED éxito.  
- [ ] Sin Wi‑Fi → LED error; al recuperar Wi‑Fi reintenta el mismo evento.  
- [ ] Dos holds seguidos → dos counters distintos → dos incidentes (salvo dedupe de ventana de negocio; ver API).  
- [ ] Secretos no están en el repo.

### 3.4 API `POST /api/device-events` (T08) — especificación

**Ruta:** `apps/web/src/app/api/device-events/route.ts`  
**Auth:** firma HMAC del dispositivo (no cookie de sesión).

#### 3.4.1 Request

El `deviceId` del firmware corresponde a `Device.publicId` en Prisma.

```http
POST /api/device-events
Content-Type: application/json
X-Pulso-Signature: <hex hmac sha256>

{
  "deviceId": "<Device.publicId>",
  "eventId": "esp32_<publicId>_42",
  "counter": 42,
  "devicePressedAtUtc": "2026-09-25T13:45:00.000Z"
}
```

Modelo ya existente (`apps/web/prisma/schema.prisma`):

- `Device`: `publicId` (único), `secretRef`, `lastCounter`, `status` (`PENDING` → `ACTIVE`), `lastSeenAt`
- `DeviceEvent`: `eventId` único, `@@unique([deviceId, counter])`, `sourceChannel`, tiempos e IP ofuscada

#### 3.4.2 Validación

1. Buscar `Device` por `publicId` (= `deviceId` del body) con `status = ACTIVE`.  
2. Resolver el secreto vía `secretRef` (piloto: valor en env o secreto revelado al pair; no loguear).  
3. Reconstruir **exactamente** el canonical JSON y verificar HMAC (comparación timing-safe).  
4. Rechazar si firma inválida → `401`.  
5. Idempotencia:
   - Si existe `DeviceEvent` con mismo `eventId` → devolver incidente ya ligado, `accepted: true`, `duplicate: true`.  
   - Si existe mismo `(deviceId, counter)` con otro `eventId` → `409` conflict.  
6. Crear `DeviceEvent` con:
   - `serverReceivedAtUtc = now`  
   - `sourceIpEncrypted` = hash/cifrado de IP (mismo helper que web)  
   - `sourceChannel = esp32` (enum Prisma)  
7. Crear incidente (reutilizar lógica de alertas web):
   - `status: created`, nuevo `caseKey`, event seq 1 `OPENED`  
   - FK `deviceId` interno del Device  
   - metadata: `sourceChannel: esp32`, `eventId`, `devicePressedAtUtc?`  
8. Actualizar `Device.lastCounter` / `lastSeenAt` si el counter es mayor.  
9. Encolar notificaciones a contactos KYC completed (igual que web).  
10. `fireAnchor` OPENED (no bloquear respuesta).  
11. Responder:

```json
{
  "accepted": true,
  "incidentId": "clx...",
  "serverTime": "2026-09-25T13:45:01.234Z",
  "duplicate": false
}
```

#### 3.4.3 Tres tiempos (mostrar en UI)

| Campo | Origen | Uso |
|-------|--------|-----|
| `devicePressedAtUtc` | ESP32 (opcional) | Informativo; puede fallar |
| `serverReceivedAtUtc` | API | Operativo / correos |
| `ledgerClosedAtUtc` | Stellar vía `ChainAnchor` | Verificable en Expert |

En cronología de `/ayuda` o detalle: etiquetar cada uno; nunca inventar horas.

#### 3.4.4 Criterios de aceptación T08

- [ ] Firma mala → 401, sin incidente.  
- [ ] Mismo `eventId` dos veces → un incidente.  
- [ ] Canal `esp32` en metadata / device_events.  
- [ ] Correo familiar + anclaje como en flujo web.  
- [ ] IP no se filtra a correo ni panel familiar.

### 3.5 Pairing web (T06) — flujo usuario

```text
Usuario (KYC OK) → /dispositivo
  → «Vincular ESP32»
  → Servidor crea deviceId + secret + muestra secret una vez
  → Usuario copia a secrets.h / Serial provision
  → Firmware flashea y conecta Wi‑Fi
  → «Probar»: instrucción “mantén el botón 2 segundos”
  → Al recibir device-event, UI muestra «Última alerta desde dispositivo»
```

Alternativa piloto rápido (si no hay tiempo de UI bonita):

1. Script admin o seed que inserta Device para el email del piloto.  
2. Secret pegado a mano en `secrets.h`.  
3. UI mínima: solo `lastSeenAt` en `/inicio`.

Documentar cuál variante usaron en el simulacro.

### 3.6 Prueba end-to-end ESP32 (checklist de laboratorio)

**Precondiciones**

- [ ] T03: app en HTTPS público  
- [ ] Usuario con KYC + ≥1 familiar verificado  
- [ ] Device ACTIVE vinculado a ese usuario  
- [ ] Firmware con SSID, `API_BASE_URL`, `DEVICE_ID`, `DEVICE_SECRET`  
- [ ] Serial Monitor 115200 abierto  

**Corrida feliz**

1. Alimentar ESP32; Serial muestra Wi‑Fi IP.  
2. Mantener botón ≥ 1.2 s.  
3. Serial: HTTP 200/202 + `incidentId`.  
4. LED patrón de éxito.  
5. `/ayuda` o `/inicio`: alerta activa.  
6. Familiar recibe correo Resend; abre `/familiar/alerta/[id]`.  
7. Ack + cierre.  
8. Links Stellar Expert para OPENED (y ACK/CLOSE si aplica).  

**Corrida red caída**

1. Apagar Wi‑Fi del router o alejar el ESP32.  
2. Pulsar: LED error; Serial “retry”.  
3. Restaurar Wi‑Fi: reenvío del **mismo** `eventId` → un solo incidente.  

**Corrida seguridad**

1. Alterar signature → 401.  
2. Replay del mismo body → duplicate, no segundo caso.  

**Evidencia para T15**

- Foto del cableado  
- Captura Serial  
- Captura incidente + correo  
- URL Stellar Expert  

### 3.7 Orden de implementación sugerido (código)

| # | Entrega | Repo |
|---|---------|------|
| 1 | `DEVICE` pairing API + secret generation | `apps/web` |
| 2 | `POST /api/device-events` + tests manuales con `curl` + HMAC | `apps/web` |
| 3 | UI `/dispositivo` mínima | `apps/web` |
| 4 | Extender `pulso_button.ino` (Wi‑Fi, HMAC, HTTPS, retry) | `firmware/` |
| 5 | `secrets.h.example` + README firmware | `firmware/` |
| 6 | Prueba física E2E + notas en este doc o issue | — |

**Prueba API sin placa (mientras se escribe firmware):**

```bash
# Pseudocódigo: firmar body con el mismo HMAC que usará el ESP32
curl -X POST "$API/api/device-events" \
  -H "Content-Type: application/json" \
  -H "X-Pulso-Signature: $HEX" \
  -d '{"deviceId":"dev_x","eventId":"test_1","counter":1}'
```

### 3.8 Fuera de alcance (no bloquear el E2E)

- Batería / UPS / modem 4G  
- Provisioning Wi‑Fi por BLE/SoftAP (puede ir después; SSID en `secrets.h` basta)  
- GPS en el ESP32  
- Firmas Stellar o envío Resend desde la placa  
- App móvil nativa  

---

## 4. Mapa rápido de archivos relevantes

| Pieza | Ruta |
|-------|------|
| Firmware stub | `firmware/pulso_button/pulso_button.ino` |
| Incidentes web | `apps/web/src/lib/incidents.ts` |
| Anclaje Stellar | `apps/web/src/lib/stellar.ts`, `stellar-submit.ts` |
| Schema Device | `apps/web/prisma/schema.prisma` → `Device`, `DeviceEvent` |
| Env ejemplo | `apps/web/.env.example` |
| Contrato testnet | `contracts/README.md` |
| Protocolo / privacidad | `/protocolo`, `/privacidad` |
| Chequeo | `/chequeo`, `apps/web/src/lib/checkin.ts` |

---

## 5. Definición de “MVP físico listo”

Se considera cerrado el bloque ESP32 cuando:

1. Hay URL HTTPS (T03).  
2. Un usuario tiene Device ACTIVE (T06).  
3. Una pulsación real crea **un** incidente vía `device-events` (T07+T08).  
4. El familiar recibe correo y puede ack/cerrar (T09/T10).  
5. Hay al menos un `tx_hash` de OPENED en Stellar Expert (T13/T14).  
6. El guion T15 tiene una corrida física documentada.

---

## 6. Historial de este documento

| Fecha | Cambio |
|-------|--------|
| 2026-09-25 | Creación: estado de tickets + guía E2E ESP32 |
