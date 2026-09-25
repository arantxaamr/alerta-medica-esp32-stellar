# Pulso: acceso, consentimiento y vínculos del piloto

## Qué significa «verificación» en esta etapa

Para el piloto en Ciudad de México, Pulso verifica el control del correo y registra el consentimiento y la aceptación explícita de cada vínculo familiar. **No verifica documentos, biometría, parentesco legal ni condiciones médicas.** La interfaz debe llamarlo «acceso y verificación del vínculo»; no debe anunciar «KYC aprobado».

## Recorrido implementado

1. La persona entra en `/acceso` y usa el código por correo de Pollar en testnet.
2. Pollar crea o recupera su cartera Stellar. Pulso solicita una firma SEP-53 sobre un reto único de cinco minutos y la verifica en el servidor.
3. Pulso envía un segundo código al correo indicado por Pollar. Este paso liga el correo verificado a la cartera probada sin confiar en un dato editable del navegador.
4. El servidor crea una sesión revocable en PostgreSQL y una cookie `HttpOnly`, `SameSite=Lax`; los códigos y tokens se guardan como hashes.
5. La persona lee y acepta el consentimiento del piloto. El servidor conserva la versión y fecha de aceptación.
6. La persona usuaria agrega hasta cinco contactos. El familiar entra con **el mismo correo** al que fue invitado, ve quién lo invitó y acepta o rechaza cada vínculo.

## Roles

| Rol | Asignación | Puede ver en esta etapa |
| --- | --- | --- |
| Persona usuaria | Correo verificado sin invitación ni privilegio de administrador | Su perfil y sus contactos |
| Familiar | Correo verificado con invitación de una persona usuaria | Sus invitaciones y vínculos aceptados |
| Administrador | Correo verificado en `ADMIN_EMAILS` | Totales del piloto, sin respuestas de salud |

El rol no se elige en el navegador. `ADMIN_PASSWORD` no se usa: una contraseña compartida de ocho caracteres sería inadecuada para el panel. Esta versión tiene un solo rol por cuenta; una cuenta que necesite ser usuaria y familiar a la vez requiere un modelo de roles múltiples antes de abrir el piloto más allá de las cuentas de prueba.

## Variables y base de datos

Copiar `apps/web/.env.example` a `apps/web/.env.local` y configurar `DATABASE_URL`, `NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY`, `SESSION_SECRET`, `ADMIN_EMAILS`, `RESEND_API_KEY` y `RESEND_FROM_EMAIL`. `.env.local` está ignorado por Git. La clave publicable de Pollar es la única que llega al navegador. No incluir llaves de Stellar ni contraseñas de administración en el frontend.

Para Prisma, usar una conexión de **Session pooler** o directa compatible con cambios de esquema. Revisar el esquema antes de ejecutar `prisma db push` en una base con datos. No ejecutar `prisma/seed.ts` en la base real del piloto: contiene datos ficticios y operaciones de limpieza.

La aplicación Pollar de testnet autoriza `http://localhost:3000`. Un puerto distinto responde `ORIGIN_NOT_ALLOWED`; también habrá que registrar el dominio HTTPS definitivo de Vercel. El esquema existente de Supabase ya contenía columnas de `KycStatus`, consentimiento e invitaciones; se conservaron y solo se añadieron `auth_attempts` y `app_sessions`.

El remitente `onboarding@resend.dev` suele estar limitado a destinatarios de prueba en Resend. Verificar un dominio propio para invitar a los 2–5 participantes reales. En esta fase, el segundo correo confirma identidad para Pulso; la invitación al familiar no se considera aceptada hasta que la persona pulse «Aceptar».

## Comprobación manual

1. Abrir `/api/health` y confirmar `database: ok`.
2. Crear las tablas nuevas y confirmar que `/acceso` ya no informa error de base de datos.
3. Entrar con Pollar y comprobar que un correo erróneo no puede crear sesión.
4. Aceptar consentimiento como persona usuaria, invitar a un familiar y confirmar que aparece «Pendiente».
5. Entrar como familiar con el correo invitado y aceptar el vínculo. Confirmar «Aceptado» en ambos paneles.
6. Entrar con un correo de `ADMIN_EMAILS` y comprobar que solo muestra totales; otro correo no obtiene el panel administrador.

El botón ESP32, los envíos de alerta y el seguimiento de salud permanecen fuera de este recorrido y se conectarán después de terminar la web.
