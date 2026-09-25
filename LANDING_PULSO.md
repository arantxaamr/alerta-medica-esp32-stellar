# Pulso — especificación de landing y experiencia web

**Versión:** 1.0 · **Público:** familias y personas cuidadoras en LATAM · **Primer piloto:** Ciudad de México · **CTA:** Ver demostración

## 1. Posicionamiento y promesa

**Pulso. Tu red de apoyo en dos toques.** La persona presiona **dos veces el botón físico** para pedir ayuda. Una sola pulsación, incluso por curiosidad o error, no genera ninguna alerta. Tras la segunda pulsación válida, la versión objetivo avisa a la red familiar; la confirmación de un familiar es un paso posterior, no uno de los dos toques del lema. **La demostración final será real con la ESP32**, pero la primera etapa local es una vista previa de la interfaz: todavía no envía correos, no opera un centro de monitoreo ni contacta automáticamente al 911.

### Mensaje principal

**Cuando alguien en casa necesita ayuda, su familia necesita enterarse y organizarse con claridad.** Pulso conecta un botón sencillo con una red de contactos y un seguimiento cotidiano opcional. El primer paso es una demostración de la experiencia para familias de CDMX.

### Voz

Cálida, directa, tranquila y concreta. Evitar «salva vidas», «atención garantizada», «diagnóstico», «ambulancia automática» y «respuesta inmediata» hasta tener evidencia y acuerdos reales. En una urgencia, indicar llamar al 911.

## 2. Identidad visual

### Logotipo recomendado

Una **P** geométrica con asta redondeada que se curva en un pulso interior. Marca de un solo color para tamaños pequeños; versión horizontal «símbolo + Pulso» y favicon con la P. La curvatura recuerda conexión y cuidado sin imitar una cruz médica ni el emblema de un servicio público. SVG editable en `apps/web/public/pulso-mark.svg`.

### Paleta

| Rol | Hex | Uso |
|---|---|---|
| Verde petróleo | `#0D5C63` | Marca, CTA principal |
| Azul tinta | `#172B4D` | Titulares y texto |
| Fondo claro | `#F7FAFC` | Superficies amplias |
| Blanco | `#FFFFFF` | Tarjetas |
| Gris texto | `#4B5563` | Texto secundario |
| Rojo alerta | `#B42318` | Solo situaciones de urgencia |
| Verde confirmación | `#146C43` | Estado atendido |
| Azul foco | `#1D4ED8` | Foco de teclado |

Tipografía: sistema sans, peso fuerte en titulares, texto de 18 px mínimo en el flujo dirigido a personas mayores. Botones de 52 px de alto o más; alto contraste y estados de foco visibles.

## 3. Arquitectura de información

1. **Header:** P de Pulso, navegación Cómo funciona, Para familias, Datos, Seguridad; CTA Ver demostración.
2. **Hero:** titular centrado en la coordinación familiar, lema literal, ilustración de tres estados (persona en casa → aviso → familiar confirma), CTA.
3. **Cómo funciona:** dos pulsaciones físicas separadas dentro de una ventana de 3 segundos, aviso a red familiar, confirmación y seguimiento. Una sola pulsación expira sin alerta. La ventana es un parámetro inicial que debe probarse con personas mayores y cuidadoras. Marcar los avisos futuros como previstos.
4. **Para cada integrante:** persona que solicita ayuda, familiar, persona cuidadora; beneficios concretos.
5. **Contexto CDMX/LATAM:** tres cifras con año, denominador y fuente enlazada; no usar datos de 2020 como si fueran actuales.
6. **Seguimiento diario:** chequeo voluntario de bienestar, sin diagnóstico ni sustitución de atención médica.
7. **Confianza:** qué se guarda, qué queda fuera de Stellar, límites del prototipo y uso de 911.
8. **CTA final:** Ver demostración.
9. **Footer:** documentación y white paper, aviso de prototipo, enlace a 911 como llamada voluntaria.

## 4. Copia lista para landing

**Eyebrow:** Pulso · piloto en Ciudad de México

**H1:** Más cerca cuando alguien necesita ayuda.

**Subtítulo:** Presiona dos veces el botón en casa para pedir ayuda. Tu red familiar podrá enterarse, confirmar quién responde y acompañar el día a día. **Tu red de apoyo en dos toques.**

**CTA principal:** Ver demostración

**Nota bajo CTA durante la primera etapa:** Vista previa interactiva. La demostración con ESP32 real se conectará al final.

**Cómo funciona:** «1. Presiona el botón una vez y suéltalo. 2. Presiónalo de nuevo dentro de 3 segundos para pedir ayuda. 3. Pulso avisará a los contactos elegidos; un familiar confirmará que atenderá». Una pulsación aislada no activa la alerta. El aviso y la confirmación son diseño objetivo, aún sin integración operativa.

**Seguimiento:** «Una pregunta diaria puede abrir una conversación a tiempo. El chequeo voluntario muestra una tendencia de bienestar autodeclarado; no es una evaluación clínica».

**Cierre:** «Empieza por conocer el flujo. Construyamos una red familiar que sepa qué hacer».

## 5. Demostración interactiva

Ruta `/demo`. **Primera etapa:** vista previa de interfaz. Estado inicial «Listo para simular»; primera pulsación simulada deja «Esperando segundo toque» **sin crear alerta**; segunda pulsación dentro de 3 segundos muestra «Solicitud registrada en la vista previa»; un control separado simula la confirmación familiar. Si pasan 3 segundos o se reinicia, vuelve a «Listo» sin alerta. El texto visible debe afirmar que no se creó un incidente real, que no se enviaron correos y que el 911 no recibió aviso. No pedir nombres ni teléfonos reales para la vista previa. **Última etapa:** sustituir los controles simulados por eventos reales de ESP32 → API → incidente → aviso y confirmación familiar verificados; entonces la página podrá llamarse demostración real.

Rutas heredadas: `/ayuda`, `/chequeo`, `/contactos` comparten navegación y diseño accesible. `/ayuda` remite a la demo y 911; `/chequeo` explica el futuro chequeo sin captar datos de salud; `/contactos` explica el futuro registro y verificación.

## 6. Diseño responsivo y accesibilidad

- Móvil 360 px: navegación compacta, botones de ancho completo, tarjetas apiladas.
- Tableta 768 px: dos columnas para beneficios y bloques informativos.
- Escritorio 1200 px: hero a dos columnas y ancho de lectura controlado.
- Acciones esenciales visibles sin hover. Enlaces descriptivos, estructura semántica, `aria-live` para cambio de estado en demo, foco de teclado, reducción de movimiento con `prefers-reduced-motion`.
- La urgencia se expresa con texto además del color. No crear falsas señales de «alerta enviada».

## 7. SEO, medición y criterio de aceptación

Meta title: `Pulso | Tu red de apoyo en dos toques`. Meta description: `Conoce la demostración de Pulso: una propuesta de alerta familiar con botón ESP32 y seguimiento cotidiano para hogares de Latinoamérica. Piloto en CDMX.` Idioma `es-MX`. Enlaces sociales solo al existir cuentas oficiales.

Eventos propuestos, sin datos personales: `landing_demo_click`, `demo_started`, `demo_family_acknowledged`, `whitepaper_opened`. Medirlos solo con consentimiento y herramienta elegida en una fase posterior.

La landing está lista cuando el CTA abre una vista previa operable por teclado, cada cifra cita una fuente y año, el flujo explica sus límites, el white paper se puede descargar desde el sitio y el diseño funciona en 360/768/1200 px. La demostración real con ESP32 es un hito posterior a la landing.

## 8. Datos públicos para la narrativa

- INEGI, Censo 2020: CDMX tenía **9,209,944 habitantes** y **2,756,319 viviendas particulares habitadas**. Fuente: [comunicado INEGI](https://www.inegi.org.mx/app/saladeprensa/noticia.html?id=6288).
- C5 CDMX: el **911 atiende y canaliza urgencias médicas las 24 horas, los 365 días**. Fuente: [Portal de Datos Abiertos CDMX](https://datos.cdmx.gob.mx/dataset/llamadas-numero-de-atencion-a-emergencias-911).
- CEPAL: en 2022 había **88.6 millones de personas de 60 años o más** en América Latina y el Caribe, **13.4%** de su población. Es contexto regional, no tamaño del mercado de Pulso. Fuente: [CEPAL](https://www.cepal.org/es/enfoques/panorama-envejecimiento-tendencias-demograficas-america-latina-caribe).

## 9. Mapeo al repositorio (auditoría al 25-09-2026)

| Componente | Estado revisado | Siguiente paso |
|---|---|---|
| Next.js | Landing local, vista previa interactiva y rutas informativas | Revisión móvil/accesibilidad; conectar demostración real después |
| ESP32 | Detecta dos pulsaciones separadas dentro de 3 segundos e imprime el evento por serial | HTTPS, autenticación, reintentos e idempotencia |
| Correos | Dependencia declarada, sin flujo conectado | Proveedor transaccional, consentimiento y verificación |
| Pollar | Propuesto en documentación, sin login visible | Integración y roles reales |
| Stellar | README con interfaz prevista | Contrato, pruebas y despliegue en testnet |
| Vercel | Documentado; sin URL de producción verificada | Configurar proyecto, variables y dominio |

## 10. Pendientes editoriales

Antes de publicar como servicio real: validar marca/dominio, aviso de privacidad, términos, consentimiento de usuarios y contactos, prueba de correos, protocolo de falla de Wi-Fi/luz y revisión jurídica de datos de salud en los países de operación. No llamar «seguridad médica» ni «servicio de emergencias» al prototipo.
