# T18 — Widget nativo Android «Necesito ayuda»

| Campo | Valor |
|--------|--------|
| **ID** | T18 |
| **Estado** | Pendiente (después del MVP web/PWA) |
| **Prioridad** | Media — no bloquea piloto con PWA |
| **Depende de** | T11 (SOS web), T03 (URL HTTPS estable), sesión Pulso + familiares verificados |
| **Rama sugerida** | `feature/android-sos-widget` (desde `main`) |
| **Relacionado** | [`PHONE_SOS_TESTERS.md`](./PHONE_SOS_TESTERS.md), atajo PWA actual |

---

## 1. Contexto: qué ya existe (sin widget)

Hoy el usuario tester pide ayuda así:

1. Abre **https://pulso-web-nu.vercel.app** (o la URL canónica que acuerden).
2. Entra con Pollar → `/inicio`.
3. Toca el botón grande rojo **Necesito ayuda**.
4. En `/ayuda` confirma **Sí, pedir ayuda ahora**.
5. Familiares verificados reciben correo → `/familiar/alerta/{id}`.

Además (PWA, no es widget):

- Instalar app / añadir a inicio desde Chrome.
- Mantener pulsado el icono Pulso → atajo de manifest **Necesito ayuda** → abre `/ayuda`.

Eso **no** es un widget de Android. Un widget es el rectángulo que vive en el escritorio del teléfono (como el de clima o WhatsApp) y se toca sin abrir la app completa primero.

---

## 2. Objetivo del ticket

Entregar un **APK mínimo** (Kotlin) con un **App Widget** de home screen que, al tocarlo, dispare el mismo flujo de ayuda familiar que la web (idealmente abriendo `/ayuda` ya autenticado o con deep link claro).

**No sustituye al 911.** El copy del widget y de la pantalla de confirmación debe seguir diciéndolo.

---

## 3. Cómo se debe ver (especificación UX)

### 3.1 En el escritorio Android (widget)

- **Forma:** celda rectangular, tamaño inicial **2×2** (redimensionable a 2×1 o 4×2 si hay tiempo).
- **Fondo:** rojo peligro Pulso (`#B42318` / `danger`), bordes redondeados suaves (no “pill” exagerado).
- **Contenido centrado:**
  - Palabra marca pequeña arriba: **Pulso** (blanco semitransparente o blanco).
  - Texto principal grande: **Necesito ayuda**.
  - Sin iconos decorativos de más; sin badges flotantes; sin stats.
- **Comportamiento al tocar:** feedback visual breve (ripple) → abre Pulso en el flujo de ayuda (ver §4).
- **Estados opcionales (fase 2):**
  - Si no hay sesión: el widget muestra subtítulo *«Entra primero»* o al tocar lleva a `/entrar`.
  - Si hay alerta abierta: subtítulo *«Alerta activa»* → abre `/ayuda` o panel de estado.

### 3.2 Vista previa en el selector de widgets

- Nombre: **Pulso — Necesito ayuda**.
- Descripción corta: *Avisa a tus familiares verificados. No sustituye al 911.*
- Preview drawable que se vea igual que el widget 2×2.

### 3.3 Tras el toque (dentro de la app / Custom Tab / Chrome)

Reutilizar la UX web actual de `/ayuda`:

1. Pantalla de confirmación: *¿Avisamos a tus familiares ahora?*
2. Botones: **Sí, pedir ayuda ahora** | **Llamar al 911** | **Cancelar**.
3. Tras enviar: pasos (sistema / familiares / ack / Stellar) + volver a inicio.

No inventar un segundo flujo de alerta en Kotlin; el backend sigue siendo `POST /api/incidents`.

### 3.4 App launcher (icono de aplicación)

- Icono Pulso (teal `#0D5C63` + “P” o asset de `apps/web/public/icons`).
- Al abrir la app sin widget: WebView o Custom Tab a `NEXT_PUBLIC_APP_URL/inicio` (o TWA).
- Suficiente para testers; no hace falta Play Store ni diseño de onboarding nativo completo en v1.

---

## 4. Comportamiento técnico (qué debe hacer)

### v1 (mínimo viable del widget)

| Paso | Qué pasa |
|------|----------|
| 1 | Usuario añade el widget al home. |
| 2 | Toca el widget. |
| 3 | Intent `VIEW` a `https://<APP_URL>/ayuda` (Chrome Custom Tabs o activity con WebView). |
| 4 | Si ya hay cookie de sesión Pulso en ese navegador → ve confirmación y puede alertar. |
| 5 | Si no hay sesión → `/ayuda` o el bridge redirige a `/entrar`; tras login vuelve a `/ayuda`. |

**APP_URL** debe ser la misma que Vercel (`NEXT_PUBLIC_APP_URL`), p. ej. `https://pulso-web-nu.vercel.app` hasta que haya dominio propio.

### v2 (mejor sesión)

- TWA (Trusted Web Activity / Bubblewrap) empaquetando el mismo origen HTTPS.
- Así la sesión web y el widget comparten cookie con más fiabilidad que abrir Chrome “suelto”.
- Widget sigue siendo nativo; el contenido es la PWA.

### Fuera de alcance v1

- Llamar a `POST /api/incidents` desde Kotlin con tokens propios.
- Notificaciones push nativas.
- Widget en iOS.
- Publicación en Play Store (solo sideload / Firebase App Distribution para testers).

---

## 5. Qué falta construir (checklist)

### Proyecto Android

- [ ] Módulo `apps/android/` (o repo `pulso-android`) con Kotlin + Gradle.
- [ ] `minSdk` razonable (24+), target actual.
- [ ] Application ID p. ej. `mx.pulso.app`.
- [ ] Iconos launcher + preview del widget.
- [ ] `AppWidgetProvider` + layout XML del botón rojo.
- [ ] `PendingIntent` → deep link `/ayuda`.
- [ ] Activity contenedora (Custom Tab / WebView / TWA).
- [ ] Build release firmado (keystore **no** en git) + APK/AAB para testers.
- [ ] README: cómo instalar el APK y cómo añadir el widget al home.

### Producto / backend (casi listo)

- [x] Flujo web `/inicio` → `/ayuda` → incidentes → correo familiar.
- [x] Confirmación anti–toque accidental en `/ayuda`.
- [x] Manifest PWA + atajo (parche mientras no hay widget).
- [ ] Deep link estable documentado (`/ayuda`) y `NEXT_PUBLIC_APP_URL` fijo.
- [ ] Pollar: origen HTTPS del dominio final en allowlist.
- [ ] (Opcional) Query `?from=widget` solo para analytics / copy, sin cambiar lógica.

### Distribución testers

- [ ] Canal de entrega del APK (Drive / Firebase App Distribution).
- [ ] Guía de 5 pasos con capturas: instalar APK → permitir fuentes → añadir widget → tocar → confirmar alerta.
- [ ] Lista de testers y correos familiares de prueba.

### QA

- [ ] Widget visible tras reiniciar el teléfono.
- [ ] Toque con sesión iniciada → llega a confirmación de `/ayuda`.
- [ ] Toque sin sesión → login → se puede completar ayuda.
- [ ] Familiar recibe correo y puede ack.
- [ ] Copy visible: no sustituye al 911.
- [ ] No envía alerta al solo añadir el widget (solo al confirmar en `/ayuda`).

---

## 6. Criterio de “terminado”

1. Un tester en Android físico tiene el widget en el home.
2. Un toque + confirmación en pantalla genera el mismo incidente que el botón web.
3. Al menos un familiar verificados recibe el correo y puede confirmar en `/familiar/alerta/{id}`.
4. Documentación de instalación en `docs/` o README del módulo Android.
5. APK versionado (tag o release GitHub) sin secretos en el repo.

---

## 7. Estimación orientativa

| Pieza | Esfuerzo |
|--------|----------|
| Widget 2×2 + deep link a `/ayuda` | 1–2 días |
| TWA / sesión más fiable | +1–2 días |
| Empaquetado testers + guía | +0.5 día |

Si el tiempo aprieta: **seguir con PWA + atajo** (ya en main tras este merge) y hacer T18 cuando haya capacidad.

---

## 8. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Cookie de sesión no compartida si abre otro browser | Preferir TWA o Custom Tabs al mismo dominio |
| Usuario toca el widget por accidente | Mantener confirmación en `/ayuda` (ya existe) |
| Dominio Vercel cambia | Configurar `APP_URL` en BuildConfig / remote config; actualizar Pollar allowlist |
| Confusión con ESP32 | Copy: “desde el teléfono”; hardware sigue pausado |

---

## 9. Referencias de diseño (tokens Pulso)

- Primary / marca: `#0D5C63`
- Danger / ayuda: `#B42318`
- Fondo app: `#F7FAFC`
- Texto: `#172B4D`
- Botón ayuda web actual: `apps/web/src/app/inicio/page.tsx` + `apps/web/src/app/ayuda/page.tsx`
- Iconos PWA: `apps/web/public/icons/`
