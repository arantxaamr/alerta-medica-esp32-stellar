export default function ChequeoPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="text-[28px] font-semibold text-text">Chequeo de hoy</h1>
      <p className="mt-2 text-text-secondary">
        Puedes omitir este chequeo. Flujo completo en T12.
      </p>
      <a
        href="/inicio"
        className="mt-8 flex min-h-[52px] items-center justify-center rounded-xl border border-border px-4 font-medium text-text"
      >
        Volver al inicio
      </a>
    </main>
  );
}
