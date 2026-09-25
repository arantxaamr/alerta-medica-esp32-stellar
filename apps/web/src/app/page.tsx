import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

const facts = [
  {
    value: "9.2 M",
    label: "personas vivían en Ciudad de México en 2020",
    source: "INEGI · Censo 2020",
    href: "https://www.inegi.org.mx/app/saladeprensa/noticia.html?id=6288",
  },
  {
    value: "24/7",
    label: "el 911 de CDMX atiende urgencias médicas",
    source: "C5 Ciudad de México",
    href: "https://datos.cdmx.gob.mx/dataset/llamadas-numero-de-atencion-a-emergencias-911",
  },
  {
    value: "88.6 M",
    label: "personas de 60 años o más vivían en LATAM y el Caribe en 2022",
    source: "CEPAL · 2022",
    href: "https://www.cepal.org/es/enfoques/panorama-envejecimiento-tendencias-demograficas-america-latina-caribe",
  },
];

const questions = [
  {
    question: "¿Qué ocurre si presiono el botón solo una vez?",
    answer: "No se inicia ninguna alerta. El segundo toque debe ocurrir después de soltar el botón y dentro de una ventana inicial de tres segundos. Este tiempo se probará con personas mayores y cuidadoras.",
  },
  {
    question: "¿Pulso llama automáticamente al 911?",
    answer: "No. Pulso no tiene integración ni convenio con autoridades. En una emergencia en México, un familiar debe llamar al 911 directamente.",
  },
  {
    question: "¿La demostración ya utiliza el dispositivo real?",
    answer: "La vista previa actual permite explorar la interfaz. La demostración final conectará el botón ESP32 con el sistema; esa integración está planificada para la última etapa de construcción.",
  },
  {
    question: "¿Qué sucede si se va la luz o falla el Wi-Fi?",
    answer: "La primera versión necesita electricidad y conexión Wi-Fi en casa. Una batería y un canal alternativo de comunicación son funciones futuras. La familia no debe depender de Pulso como único medio para pedir ayuda.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="contenido">
        <section className="hero shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> PILOTO EN CIUDAD DE MÉXICO</p>
            <h1 id="hero-title">Más cerca cuando alguien <em>necesita ayuda.</em></h1>
            <p className="hero-lead">Dos pulsaciones del botón en casa iniciarán una solicitud de ayuda. La red familiar podrá enterarse y saber quién responde.</p>
            <p className="hero-motto">Tu red de apoyo en dos toques.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/demo">Ver demostración <span aria-hidden="true">↗</span></Link>
              <Link className="button button-quiet" href="/acceso">Entrar al piloto <span aria-hidden="true">↗</span></Link>
            </div>
            <a className="hero-scroll-link" href="#como-funciona">Descubre cómo funciona <span aria-hidden="true">↓</span></a>
            <p className="microcopy">Vista previa interactiva. La demostración con ESP32 real se conectará al final.</p>
          </div>
          <div className="hero-visual" role="img" aria-label="Ilustración del botón Pulso y un ejemplo de confirmación familiar">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="device-illustration">
              <div className="device-led" />
              <div className="device-button">P</div>
              <p>Pulso en casa</p>
            </div>
            <div className="status-card">
              <div className="status-card-top"><span className="status-icon">✦</span><span className="status-badge">EJEMPLO FAMILIAR</span></div>
              <strong>Alguien necesita apoyo</strong>
              <p>Así se vería el aviso a la red elegida</p>
              <div className="status-divider" />
              <div className="avatar-row"><span className="avatar">M</span><div><b>María confirmó</b><small>La familia sabe quién responde</small></div><span className="checkmark">✓</span></div>
            </div>
            <span className="visual-caption">Vista conceptual · No representa una alerta enviada</span>
          </div>
        </section>

        <section className="section section-tinted" id="como-funciona" aria-labelledby="how-title">
          <div className="shell">
            <div className="section-intro"><p className="eyebrow">UN FLUJO CLARO</p><h2 id="how-title">La tranquilidad empieza por saber <em>qué sigue.</em></h2><p>Dos pulsaciones deliberadas, una familia informada y una persona que asume la respuesta.</p></div>
            <div className="steps-grid">
              <article className="step-card"><span className="step-num">01</span><span className="step-symbol" aria-hidden="true">◎</span><h3>Presiona dos veces</h3><p>Una pulsación aislada no inicia nada. El segundo toque, después de soltar el botón y dentro de tres segundos, inicia la solicitud.</p></article>
              <article className="step-card"><span className="step-num">02</span><span className="step-symbol" aria-hidden="true">↗</span><h3>La red se entera</h3><p>La versión operativa enviará el aviso a familiares elegidos y verificados, con el estado visible para la red.</p></article>
              <article className="step-card"><span className="step-num">03</span><span className="step-symbol" aria-hidden="true">✓</span><h3>Alguien confirma</h3><p>Un familiar podrá indicar que atenderá. Los demás sabrán quién asumió la respuesta.</p></article>
            </div>
            <p className="section-note">El envío y la confirmación reales aún están en construcción. <Link href="/demo">Explorar la vista previa →</Link></p>
          </div>
        </section>

        <section className="section shell" id="familias" aria-labelledby="family-title">
          <div className="split-section">
            <div><p className="eyebrow">HECHO PARA CUIDARNOS</p><h2 id="family-title">Una experiencia que entiende a <em>toda la familia.</em></h2><p className="section-lead">Pulso se diseña alrededor de tres conversaciones: pedir ayuda, saber quién responde y preguntar cómo estuvo el día.</p><Link href="/demo" className="text-link">Conoce el recorrido ↗</Link></div>
            <div className="benefit-list">
              <article><span className="benefit-icon">01</span><div><h3>Para quien está en casa</h3><p>Un botón sencillo y una pantalla con texto grande, contraste y estados claros.</p></div></article>
              <article><span className="benefit-icon">02</span><div><h3>Para familiares</h3><p>Un lugar para entender el aviso y saber quién se encargará de responder.</p></div></article>
              <article><span className="benefit-icon">03</span><div><h3>Para personas cuidadoras</h3><p>Un chequeo voluntario para abrir conversaciones cotidianas, sin dar diagnósticos.</p></div></article>
            </div>
          </div>
        </section>

        <section className="section facts-section" id="contexto" aria-labelledby="facts-title">
          <div className="shell">
            <div className="section-intro"><p className="eyebrow">EL CONTEXTO IMPORTA</p><h2 id="facts-title">Empezamos en CDMX.<br /><em>Pensamos en LATAM.</em></h2><p>Datos públicos para entender la escala; no son resultados ni usuarios de Pulso.</p></div>
            <div className="facts-grid">{facts.map((fact) => <article className="fact-card" key={fact.value}><strong>{fact.value}</strong><p>{fact.label}</p><a href={fact.href} target="_blank" rel="noopener noreferrer">{fact.source} ↗</a></article>)}</div>
          </div>
        </section>

        <section className="section shell" id="cuidado" aria-labelledby="care-title">
          <div className="care-panel">
            <div className="care-art" aria-hidden="true"><div className="care-circle"><span>♡</span><div className="care-line"><i /><i /><i /><i /><i /></div></div><span className="care-spark spark-a">✳</span><span className="care-spark spark-b">✳</span></div>
            <div className="care-copy"><p className="eyebrow">MÁS ALLÁ DE UNA ALERTA</p><h2 id="care-title">Cuidar también es <em>preguntar cómo estás.</em></h2><p>El chequeo diario propuesto ayudará a conversar sobre cambios en el bienestar. Será voluntario y no reemplazará una valoración médica.</p><Link className="button button-outline" href="/chequeo">Conocer el chequeo ↗</Link></div>
          </div>
        </section>

        <section className="section trust-section" id="confianza" aria-labelledby="trust-title">
          <div className="shell trust-grid">
            <div><p className="eyebrow">DISEÑADO CON RESPONSABILIDAD</p><h2 id="trust-title">La confianza se construye con <em>límites claros.</em></h2></div>
            <div><p>Pulso está en desarrollo. La vista previa no envía mensajes reales. No tenemos convenio con autoridades ni conexión automática al 911. En una urgencia en México, un familiar debe llamar al 911.</p><p>El diseño de Stellar contempla registrar solo una prueba de integridad del incidente; los datos clínicos, correos, domicilios e IP quedarían fuera de la cadena.</p><a className="text-link" href="/WHITEPAPER_PULSO.md" download>Descargar el white paper (.md) ↗</a></div>
          </div>
        </section>

        <section className="section shell faq-section" id="preguntas" aria-labelledby="faq-title">
          <div className="section-intro"><p className="eyebrow">PREGUNTAS FRECUENTES</p><h2 id="faq-title">Lo esencial, <em>sin dudas.</em></h2></div>
          <div className="faq-list">{questions.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className="closing shell" aria-labelledby="closing-title">
          <p className="eyebrow">CONOCE PULSO</p><h2 id="closing-title">Una red preparada empieza<br />con una <em>conversación.</em></h2><p>Explora cómo se vería una solicitud de ayuda y la confirmación familiar.</p><Link className="button button-light" href="/demo">Ver demostración ↗</Link><small>Vista previa interactiva. La conexión con la ESP32 real llegará en la última etapa.</small>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
