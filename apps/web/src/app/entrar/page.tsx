import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function EntrarPage() {
  const pollarEnabled = Boolean(process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <Link href="/" className="text-sm font-medium text-primary">
        ← Pulso
      </Link>
      <h1 className="mt-4 text-[28px] font-semibold text-text">Probar Pulso</h1>
      <p className="mt-2 text-text-secondary">
        Entra con tu correo. Después completarás el alta (persona usuaria) o te
        unirás como familiar con el enlace de invitación.
      </p>
      <div className="mt-8">
        <LoginForm pollarEnabled={pollarEnabled} />
      </div>
    </main>
  );
}
