# Firmware Pulso — ESP32 DevKit V1

Rama de trabajo: `feature/esp32-device-integration`  
Plan completo: [`TICKETS_PENDIENTES.md`](../TICKETS_PENDIENTES.md) §3.

## 1. Conexiones (haz esto primero)

Placa: **ESP32-WROOM-32** en DevKit V1. Pulsador **normalmente abierto**.

```text
                    ESP32 DevKit V1
                 ┌─────────────────┐
                 │                 │
   terminal A ───┤ GPIO27          │
   del botón     │                 │
                 │            GND  ├──── terminal B del botón
                 │                 │
                 │  GPIO2 (LED)    │  ← LED integrado (no cablear)
                 └─────────────────┘
```

| Cable | Pin ESP32 | Pulsador |
|-------|-----------|----------|
| Señal | **GPIO27** (a veces etiquetado `D27` / `27`) | Una pata del interruptor |
| Tierra | **GND** | La otra pata |

### Reglas

1. **No** conectes 3.3 V ni 5 V al botón en este esquema.  
2. El firmware usa `INPUT_PULLUP`: en reposo el pin está en HIGH; al pulsar baja a LOW.  
3. Si el botón tiene **4 patas**, mide continuidad: usa un par que **abra/cierre** al pulsar (no el par siempre unido).  
4. Confirma en la serigrafía de **tu** placa que el pin es realmente GPIO27.

### Cómo comprobar el cableado (sin Wi‑Fi)

1. Abre `firmware/pulso_button/pulso_button.ino` en Arduino IDE.  
2. Placa: **ESP32 Dev Module**, puerto COM correcto.  
3. Sube el sketch actual (solo botón + LED).  
4. Monitor serie **115200**.  
5. Mantén el botón ~**1.2 s**:
   - LED integrado se enciende al pulsar  
   - En Serial: `ALERT_TRIGGER — sustained press detected...`

Si no pasa nada: revisa GND/GPIO27, otro pin serigrafiado, o cambia de par de patas del pulsador.

---

## 2. Orden de trabajo en esta rama

```text
Hoy (hardware)
  └─ Cablear + verificar Serial/LED  ← estás aquí

Luego (software, en este orden)
  1. POST /api/device-events (firma HMAC + dedupe)     T08
  2. Pairing / Device ACTIVE en web                    T06
  3. Firmware: Wi‑Fi + HTTPS + HMAC + reintentos       T07
  4. URL pública (Vercel o túnel) para la placa
  5. Prueba E2E: botón → incidente → correo → Stellar  T15
```

**Importante:** el ESP32 necesita `https://...` (no `localhost`). Mientras no haya Vercel, se puede usar un túnel (Cloudflare Tunnel / ngrok) apuntando a `npm run dev`.

---

## 3. Secretos del firmware (después del pairing)

Crear `firmware/pulso_button/secrets.h` (en `.gitignore`, **nunca** en Git):

```cpp
#pragma once
#define WIFI_SSID    "tu_wifi"
#define WIFI_PASS    "tu_password"
#define API_BASE_URL "https://tu-app.vercel.app"  // sin / final
#define DEVICE_ID    "..."   // Device.publicId
#define DEVICE_SECRET "..."  // revelado una vez al vincular
```

---

## 4. Criterio de “conexiones OK”

- [ ] Pulsación corta (&lt; 1 s) no dispara alerta en Serial  
- [ ] Pulsación ≥ 1.2 s → `ALERT_TRIGGER` + LED  
- [ ] Foto del cableado para el simulacro T15  
