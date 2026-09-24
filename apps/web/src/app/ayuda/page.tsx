export default function AyudaPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="text-[28px] font-semibold text-text">Estamos enviando tu alerta…</h1>
      <ul className="mt-6 space-y-3 text-lg text-text">
        <li>✓ Recibida por el sistema (stub — T08)</li>
        <li>○ Familiares: envío en proceso</li>
        <li>○ Familiar: pendiente de confirmar</li>
      </ul>
      <div className="mt-8 flex flex-col gap-3">
        <a
          href="tel:911"
          className="flex min-h-[52px] items-center justify-center rounded-xl bg-danger px-4 font-semibold text-white"
        >
          Llamar al 911
        </a>
        <a
          href="/"
          className="flex min-h-[52px] items-center justify-center rounded-xl border border-border px-4 font-medium text-text"
        >
          Volver al inicio
        </a>
      </div>
      <p className="mt-6 text-sm text-text-secondary">
        Simulacro: esta pantalla aún no crea un incidente real.
      </p>
    </main>
  );
}
