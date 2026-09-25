import Link from "next/link";
import {
  ACK_TIMEOUT_MINUTES,
  ALERT_STEPS,
  APPROVED_MESSAGES,
  PILOT,
  PROTOCOL_VERSION,
  ROLES,
  protocolSummaryLines,
} from "@/lib/protocol";

export const metadata = {
  title: "Protocolo familiar — Pulso",
  description: "Protocolo del piloto Pulso en Ciudad de México",
};

export default function ProtocoloPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm font-medium text-primary">
        ← Pulso
      </Link>
      <p className="mt-4 text-sm font-medium text-primary">
        T01 · {PROTOCOL_VERSION}
      </p>
      <h1 className="mt-2 text-[28px] font-semibold text-text">
        Protocolo familiar
      </h1>
      <p className="mt-2 text-text-secondary">
        Alcance del piloto en {PILOT.city}. {PILOT.note}
      </p>

      <section className="mt-8 space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-text">Resumen</h2>
        <ul className="list-disc space-y-2 pl-5 text-text-secondary">
          {protocolSummaryLines().map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text">Roles</h2>
        <div className="mt-4 space-y-4">
          {[ROLES.principal, ROLES.suplente].map((role) => (
            <div
              key={role.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <h3 className="font-semibold text-text">{role.label}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-text-secondary">
                {role.duties.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          En el alta de contactos, marca al menos un contacto como{" "}
          <strong className="text-text">principal</strong>. Los demás actúan
          como suplentes. Plazo de confirmación:{" "}
          <strong className="text-text">{ACK_TIMEOUT_MINUTES} minutos</strong>.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text">
          Cuando llega una alerta
        </h2>
        <ol className="mt-4 space-y-3">
          {ALERT_STEPS.map((step, i) => (
            <li
              key={step.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="font-medium text-text">
                {i + 1}. {step.title}
              </p>
              <p className="mt-1 text-text-secondary">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-text">Mensajes del producto</h2>
        <p className="mt-2 text-text-secondary">
          Lema: «{APPROVED_MESSAGES.productTagline}». Acciones: «
          {APPROVED_MESSAGES.userCta}» / «{APPROVED_MESSAGES.familyCta}».
        </p>
        <p className="mt-2 text-text-secondary">{APPROVED_MESSAGES.not911}</p>
        <p className="mt-2 text-sm text-danger">
          {APPROVED_MESSAGES.simulationBanner}
        </p>
      </section>

      <p className="mt-8 text-sm text-text-secondary">
        También puedes leer el{" "}
        <Link href="/privacidad" className="text-primary underline">
          aviso de privacidad
        </Link>
        .
      </p>
    </main>
  );
}
