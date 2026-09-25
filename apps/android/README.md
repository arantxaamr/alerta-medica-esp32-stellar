# Pulso Android — widget «Necesito ayuda» (T18 v1)

App mínima en Kotlin con un **widget 2×2** en el escritorio. Al tocarlo abre la web de Pulso en `/ayuda` (Custom Tabs).

No sustituye al 911. La confirmación y el envío de la alerta siguen siendo en la web.

## Requisitos

- Android Studio Ladybug+ (o compatible con AGP 8.7)
- JDK 17
- Dispositivo o emulador Android 8.0+ (API 26)

## URL de Pulso

Por defecto apunta a:

```text
https://pulso-web-nu.vercel.app
```

Para cambiarla: en `app/build.gradle.kts` edita `PULSO_BASE_URL` y vuelve a compilar.

## Abrir y generar APK

1. Abre la carpeta `apps/android` en Android Studio (**Open**).
2. Crea `local.properties` (puedes copiar `local.properties.example`) con tu SDK, por ejemplo:

```properties
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

3. Sync Gradle.
4. Menú **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. El APK debug queda en `app/build/outputs/apk/debug/`.

O desde terminal (con SDK configurado):

```bash
cd apps/android
.\gradlew.bat assembleDebug
```

## Instalar en un teléfono tester

1. Copia el APK al teléfono.
2. Permite instalar apps de fuentes desconocidas / el administrador de archivos.
3. Instala **Pulso**.
4. Mantén pulsado un espacio vacío del escritorio → **Widgets** → **Pulso — Necesito ayuda**.
5. Coloca el widget rojo.
6. Tócalo → debe abrir `/ayuda` (si no hay sesión, entra con Pollar y vuelve a intentar).

## Comportamiento

| Acción | Resultado |
|--------|-----------|
| Icono de la app | Abre `/inicio` |
| Widget «Necesito ayuda» | Abre `/ayuda?from=widget` |
| Confirmar en la web | Mismo flujo que el botón web (`POST /api/incidents`) |

## Qué falta (v2)

Ver [`docs/T18_ANDROID_WIDGET.md`](../../docs/T18_ANDROID_WIDGET.md): TWA para compartir cookies con más fiabilidad, Play Store, estados del widget, etc.

## Nota de seguridad

No subas keystores ni `local.properties` al repo. El `.gitignore` de esta carpeta ya los excluye.
