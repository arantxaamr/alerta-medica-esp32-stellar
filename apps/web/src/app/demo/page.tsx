"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

type Step = 0 | 1 | 2 | 3;
const DOUBLE_PRESS_WINDOW_MS = 3000;

const titles = [
  "Listos para empezar",
  "Esperando el segundo toque",
  "Solicitud registrada en la vista previa",
  "María confirmó que atenderá",
];

const descriptions = [
  "Imagina que Ana está en casa y necesita contactar a su red de apoyo.",
  "Se detectó una pulsación. No hay alerta: hace falta presionar otra vez dentro de tres segundos.",
  "Dos pulsaciones válidas iniciarían la solicitud cuando el sistema real esté conectado. Aquí no se enviaron avisos.",
  "En esta vista previa, un familiar asumió la respuesta y la red puede verlo.",
];

export default function DemoPage() {
  const [step, setStep] = useState<Step>(0);
  const firstPressAt = useRef<number | null>(null);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
  }, []);

  function reset() {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    expiryTimer.current = null;
    firstPressAt.current = null;
    setStep(0);
  }

  function pressButton() {
    const now = Date.now();
    const inWindow = step === 1 && firstPressAt.current !== null &&
      now - firstPressAt.current <= DOUBLE_PRESS_WINDOW_MS;

    if (inWindow) {
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
      firstPressAt.current = null;
      setStep(2);
      return;
    }

    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    firstPressAt.current = now;
    setStep(1);
    expiryTimer.current = setTimeout(() => {
      firstPressAt.current = null;
      expiryTimer.current = null;
      setStep(0);
    }, DOUBLE_PRESS_WINDOW_MS);
  }

  return (
    <>
      <SiteHeader />
      <main id="contenido" className="inner-page">
        <div className="shell inner-shell">
          <Link href="/" className="back-link">← Volver a Pulso</Link>
          <p className="eyebrow">VISTA PREVIA INTERACTIVA</p>
          <h1>Dos toques en casa. <em>Una red que responde.</em></h1>
          <p className="inner-lead">Explora cómo se verá la demostración. La conexión con el botón ESP32 real es la última etapa de construcción.</p>
          <div className="notice" role="note">
            <strong>Esta es una vista previa.</strong> Ningún control de esta página crea incidentes reales, envía correos ni avisa al 911.
          </div>

          <section className="demo-panel" aria-labelledby="demo-title">
            <p className="eyebrow">ESTADO {step + 1} DE 4</p>
            <h2 id="demo-title">{titles[step]}</h2>
            <p>{descriptions[step]}</p>
            <div className="demo-state" role="status" aria-live="polite">
              <span aria-hidden="true">{step === 0 ? "◎" : step === 1 ? "◉" : step === 2 ? "↗" : "✓"}</span>
              <div>
                <strong>{step === 0 ? "Botón en casa, listo" : step === 1 ? "Primera pulsación: sin alerta" : step === 2 ? "Doble pulsación reconocida" : "Familiar responsable: María"}</strong>
                <small>{step === 0 ? "Una pulsación aislada no activa nada" : step === 1 ? "Si se agota el tiempo, vuelve a reposo" : step === 2 ? "Esperando confirmación familiar simulada" : "Estado final de la vista previa"}</small>
              </div>
            </div>
            <div className="demo-actions">
              {step < 2 && <button type="button" className={`button ${step === 0 ? "button-primary" : "button-danger"}`} onClick={pressButton}>{step === 0 ? "Simular primer toque" : "Simular segundo toque"} ↗</button>}
              {step === 2 && <button type="button" className="button button-primary" onClick={() => setStep(3)}>Simular confirmación familiar ✓</button>}
              {step > 0 && <button type="button" className="button button-outline" onClick={reset}>Reiniciar vista previa</button>}
            </div>
            <p className="demo-disclaimer">No se enviaron avisos. Si estás ante una urgencia real en México, llama al <a href="tel:911">911</a>.</p>
          </section>
          <div className="page-actions">
            <Link className="button button-quiet" href="/chequeo">Conocer el chequeo diario ↗</Link>
            <Link className="button button-quiet" href="/contactos">Ver red de contactos ↗</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
