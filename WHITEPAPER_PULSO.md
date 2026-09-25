# Pulso — white paper de producto y modelo de negocio

**Versión para jurado:** 1.0 · 25 de septiembre de 2026 · **Piloto:** Ciudad de México · **Visión:** Latinoamérica

## Resumen ejecutivo

Pulso propone que una persona en casa pueda pedir ayuda a su red familiar mediante un botón ESP32 conectado a Wi-Fi. La familia vería el incidente, confirmaría quién responde y tendría un historial legible. Un chequeo diario voluntario complementaría la conversación de cuidado. La experiencia web y sus avisos son distintos de una solicitud al 911; ante una urgencia se debe llamar al número local de emergencias.

El repositorio contiene un front inicial, detección local de pulsación en firmware y la interfaz prevista de un contrato Soroban. **Aún no existe un flujo completo de alerta en producción.** La demo rediseñada muestra el recorrido de manera simulada. La hipótesis de Pulso es que una coordinación más clara puede reducir incertidumbre en la familia; eso debe medirse en un piloto y no se presenta como resultado probado.

## El problema, con datos verificables

El Censo 2020 registró **9,209,944 habitantes** y **2,756,319 viviendas particulares habitadas** en Ciudad de México ([INEGI](https://www.inegi.org.mx/app/saladeprensa/noticia.html?id=6288)). Es una escala de contexto para el piloto, no una cifra de personas usuarias potenciales.

El 911 de CDMX atiende y canaliza urgencias médicas a toda hora ([C5 CDMX](https://datos.cdmx.gob.mx/dataset/llamadas-numero-de-atencion-a-emergencias-911)). Pulso necesita dejar claro a la familia quién contacta al 911 cuando sea necesario. La app no reporta directamente a autoridades y no tiene convenio con ellas.

En América Latina y el Caribe había **88.6 millones de personas de 60 años o más en 2022**, equivalentes al **13.4%** de la población regional ([CEPAL](https://www.cepal.org/es/enfoques/panorama-envejecimiento-tendencias-demograficas-america-latina-caribe)). El envejecimiento amplía la relevancia del cuidado familiar, pero no demuestra demanda por esta solución. La validación requiere entrevistas y uso real consentido.

## Solución propuesta

**Persona en casa:** botón físico de pulsación sostenida, señal visual, panel con texto grande y contactos elegidos.

**Familia/cuidadora:** aviso por correo, apertura del caso, confirmación de responsabilidad y estado compartido. La confirmación es el segundo «toque» del lema, no una segunda pulsación exigida a la persona.

**Seguimiento diario:** preguntas breves de bienestar auto-reportado, con opción de omitir. Un puntaje interno puede mostrar tendencia, nunca diagnóstico ni predicción de urgencias. Ante síntomas alarmantes, la interfaz dirige a atención profesional.

## Flujo objetivo de extremo a extremo

1. Alta consentida de persona y 2–5 contactos; verificación de correo y prueba del canal.
2. Vinculación del ESP32 WROOM-32 al hogar con Wi-Fi y electricidad.
3. Pulsación sostenida; evento HTTPS autenticado, `event_id` e idempotencia.
4. Backend guarda hora del dispositivo y hora del servidor, IP de ingreso con retención limitada, caso y estado.
5. Correo transaccional a contactos verificados; bitácora de entrega y rebotes.
6. Primer familiar confirma y puede llamar al 911; el sistema muestra quién asumió la respuesta.
7. Cierre con motivo y sello de auditoría; solo un compromiso criptográfico mínimo se registra en Stellar testnet.

Sin red o luz el diseño de primera fase no garantiza funcionamiento. Batería y conectividad alternativa pertenecen a la hoja de ruta.

## Arquitectura y límites de datos

| Capa | Tecnología prevista | Datos |
|---|---|---|
| Dispositivo | ESP32 WROOM-32, pulsador, LED, Wi-Fi | ID de dispositivo, evento y sello de tiempo |
| Web/API | Next.js en Vercel | Usuarios, roles, consentimientos, incidentes y estados |
| Identidad | Pollar, sujeto a integración y verificación | Inicio de sesión por correo |
| Persistencia | PostgreSQL/Supabase + Prisma | Datos personales cifrados/controlados, bitácora |
| Avisos | Servicio transaccional de correo | Mensaje mínimo, entrega y rebotes |
| Evidencia | Soroban/Stellar testnet | ID seudónimo, secuencia, tipo de evento, tiempo del servidor y hash |

**Nunca poner en cadena:** nombres, correos, domicilio, IP, ubicación, síntomas, respuestas de chequeo o claves de acceso. Un hash no prueba que hubo atención médica; solo permite verificar que un registro no cambió después de su anclaje. La IP aproximada no es ubicación confiable del paciente. La ubicación precisa queda como función futura con consentimiento específico.

## Privacidad, accesibilidad y operación

Los datos de salud son sensibles. Antes de usar personas reales: aviso de privacidad, finalidad clara, consentimiento expreso, revocación, retención, borrado, control de acceso por rol, cifrado, bitácora de acceso y revisión legal mexicana aplicable. No recopilar datos médicos para la demo. Para personas mayores: botones grandes, textos breves, alto contraste, lenguaje claro, estados expresados en palabras y operación por teclado.

La fiabilidad exige prueba de pulsación, entrega de correos, rebotes, reintentos, confirmación, falso positivo, duplicados y caída de internet. Ninguna interfaz debe mostrar «familia avisada» antes de confirmar entrega del proveedor; aun entregado, correo no garantiza que alguien lo leyó.

## Modelo de negocio — canvas inicial

| Bloque | Hipótesis a validar |
|---|---|
| Segmentos | Familias con persona que vive o pasa tiempo sola en casa; cuidadoras familiares; organizaciones de cuidado como canal posterior. |
| Propuesta de valor | Pedir ayuda con un gesto sencillo y coordinar quién responde, con historial comprensible. |
| Canales | Referencias familiares, clínicas/comunidades de cuidado con acuerdos futuros, web y pilotos locales. |
| Relación | Autoconfiguración asistida, guía para contactos, prueba periódica y soporte humano definido. |
| Ingresos | Hipótesis: kit de dispositivo y suscripción mensual por hogar; validar disposición a pagar antes de fijar precio. |
| Recursos | Firmware, plataforma, soporte, infraestructura de correo, seguridad y diseño accesible. |
| Actividades | Validar entrega y respuesta, configurar hogares, soporte, privacidad, mejora del producto. |
| Socios | Proveedor de correo/infraestructura; proveedores de hardware; instituciones solo con convenio explícito. |
| Costos | ESP32 y ensamblaje, conectividad del hogar, hosting, correos, soporte, reposición y cumplimiento. |

No se publica TAM/SAM/SOM inventado. Para calcularlo: hogares con necesidad observada × adopción verificable × disposición a pagar, usando encuestas del piloto y estadísticas oficiales por país. Tampoco se prometen ingresos o reducciones de mortalidad.

## Métricas del piloto CDMX

Piloto inicial con **2–5 usuarios y familiares voluntarios**. Medir: porcentaje de dispositivos vinculados; pulsaciones de prueba recibidas; correos aceptados por proveedor; tiempo hasta apertura y confirmación; duplicados; falsos positivos; comprensión del estado por personas mayores; finalización del chequeo; satisfacción y fricciones. Separar simulacros de incidentes reales. Criterio mínimo antes de confiar en el sistema: pruebas completas, canal alternativo documentado y protocolo claro de que el familiar llama al 911.

## Hoja de ruta

1. **Demo de hackathon:** landing accesible, simulación interactiva y documentación honesta.
2. **MVP técnico:** autenticación, consentimiento, dispositivos, ingestión autenticada, correos y confirmación familiar.
3. **Prueba controlada:** 2–5 hogares, observabilidad, protocolos y revisión de privacidad.
4. **Evidencia y escala:** contrato Soroban en testnet con hash mínimo; evaluación de utilidad antes de pasar a mainnet.
5. **Futuro:** batería, conectividad alternativa y ubicación optativa; expansión país por país con normativa y números de emergencias locales.

## Demostración para el jurado

Mostrar la P de Pulso y el lema; ejecutar una pulsación simulada, una confirmación familiar y el estado final; después enseñar el firmware detectando una pulsación local. Separar con precisión cada pieza funcionando de la arquitectura futura. Explicar por qué Stellar guarda una prueba de integridad y no información clínica. Cerrar con la hipótesis que el piloto comprobará: si la familia entiende más rápido quién actúa.

## Fuentes primarias

1. [INEGI, resultados del Censo 2020 para CDMX](https://www.inegi.org.mx/app/saladeprensa/noticia.html?id=6288).
2. [C5 CDMX, conjunto de datos y descripción del 911](https://datos.cdmx.gob.mx/dataset/llamadas-numero-de-atencion-a-emergencias-911).
3. [CEPAL, panorama del envejecimiento en América Latina y el Caribe](https://www.cepal.org/es/enfoques/panorama-envejecimiento-tendencias-demograficas-america-latina-caribe).

Las cifras conservan el año y ámbito geográfico originales. El documento distingue hechos públicos, estado del código e hipótesis comerciales.
