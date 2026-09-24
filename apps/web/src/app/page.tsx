import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Pulso · modo prueba</p>
        <h1 className="text-[28px] font-semibold leading-tight text-text">
          Hola, Ana
        </h1>
        <p className="text-text-secondary">
          Botón en casa: pendiente de vincular · Tu red de apoyo en un toque
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <Link
          href="/ayuda"
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-danger px-4 text-center text-lg font-semibold text-white"
        >
          Necesito ayuda
        </Link>
        <Link
          href="/chequeo"
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary px-4 text-center font-medium text-white"
        >
          Hacer mi chequeo de hoy
        </Link>
        <Link
          href="/contactos"
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-border bg-surface px-4 text-center font-medium text-text"
        >
          Ver mis contactos de ayuda
        </Link>
      </section>

      <p className="text-sm text-text-secondary">
        Esto es un simulacro de hackathon. No sustituye al 911. Health:{" "}
        <Link href="/api/health" className="text-primary underline">
          /api/health
        </Link>
      </p>
    </main>
  );
}
