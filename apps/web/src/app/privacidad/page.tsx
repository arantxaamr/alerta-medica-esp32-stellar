import Link from "next/link";
import {
  ACCESS_MATRIX,
  PRIVACY_EFFECTIVE,
  PRIVACY_SECTIONS,
  PRIVACY_SUMMARY,
  PRIVACY_VERSION,
} from "@/lib/privacy";

export const metadata = {
  title: "Aviso de privacidad — Pulso",
  description: "Aviso de privacidad y matriz de acceso del piloto Pulso",
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm font-medium text-primary">
        ← Pulso
      </Link>
      <p className="mt-4 text-sm font-medium text-primary">
        T02 · {PRIVACY_VERSION}
      </p>
      <h1 className="mt-2 text-[28px] font-semibold text-text">
        Aviso de privacidad
      </h1>
      <p className="mt-2 text-text-secondary">
        Vigente {PRIVACY_EFFECTIVE}. Resumen:
      </p>
      <p className="mt-3 whitespace-pre-line rounded-xl border border-border bg-surface p-4 text-text-secondary">
        {PRIVACY_SUMMARY}
      </p>

      <div className="mt-8 space-y-6">
        {PRIVACY_SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-text">{s.title}</h2>
            <p className="mt-2 text-text-secondary">{s.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text">
          Matriz de acceso por rol
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Qué puede ver cada rol en el piloto. “No por defecto” significa que no
          se expone en paneles salvo cambio explícito de producto.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-surface">
              <tr className="border-b border-border text-text">
                <th className="px-3 py-3 font-semibold">Dato</th>
                <th className="px-3 py-3 font-semibold">Usuaria</th>
                <th className="px-3 py-3 font-semibold">Familiar</th>
                <th className="px-3 py-3 font-semibold">Admin</th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_MATRIX.map((row) => (
                <tr
                  key={row.data}
                  className="border-b border-border text-text-secondary last:border-0"
                >
                  <td className="px-3 py-3 font-medium text-text">
                    {row.data}
                  </td>
                  <td className="px-3 py-3">{row.user}</td>
                  <td className="px-3 py-3">{row.family}</td>
                  <td className="px-3 py-3">{row.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-8 text-sm text-text-secondary">
        Protocolo operativo del familiar:{" "}
        <Link href="/protocolo" className="text-primary underline">
          ver protocolo
        </Link>
        .
      </p>
    </main>
  );
}
