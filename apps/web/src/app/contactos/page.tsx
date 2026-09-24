export default function ContactosPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="text-[28px] font-semibold text-text">Contactos de ayuda</h1>
      <p className="mt-2 text-text-secondary">
        Alta y verificación de contactos en T06. Por ahora: 1 familiar demo.
      </p>
      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <p className="font-medium text-text">Familiar demo (principal)</p>
        <p className="text-text-secondary">familiar.demo@pulso.local</p>
      </div>
      <a
        href="/"
        className="mt-8 flex min-h-[52px] items-center justify-center rounded-xl border border-border px-4 font-medium text-text"
      >
        Volver al inicio
      </a>
    </main>
  );
}
