"use client";

import { useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Guía estable para testers: fijar Pulso en la pantalla de inicio.
 * No depende de que `beforeinstallprompt` siga vivo (ese evento solo
 * dispara una vez y hacía que el cuadro parpadeara).
 */
export function InstallHint() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (standalone) {
      setInstalled(true);
      setReady(true);
      return;
    }

    try {
      if (sessionStorage.getItem("pulso-install-hint-dismissed") === "1") {
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      deferredRef.current = null;
      setCanPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    setReady(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!ready || installed || dismissed) {
    return null;
  }

  async function install() {
    const deferred = deferredRef.current;
    if (!deferred || installing) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      // El evento no se reutiliza; dejamos el cuadro con instrucciones.
      deferredRef.current = null;
      setCanPrompt(false);
      setInstalling(false);
    }
  }

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem("pulso-install-hint-dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <aside className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
      <p className="font-medium text-text">Fija Pulso en tu teléfono</p>
      <p className="mt-1">
        Para testers: añádelo a la pantalla de inicio. Luego puedes mantener
        pulsado el icono y usar el atajo{" "}
        <span className="font-medium text-text">Necesito ayuda</span>.
      </p>
      {canPrompt ? (
        <button
          type="button"
          disabled={installing}
          onClick={() => void install()}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary px-3 font-medium text-white disabled:opacity-60"
        >
          {installing ? "Abriendo…" : "Instalar en este teléfono"}
        </button>
      ) : (
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Abre el menú de Chrome (⋮).</li>
          <li>
            Elige <span className="font-medium text-text">Instalar app</span> o{" "}
            <span className="font-medium text-text">
              Añadir a pantalla de inicio
            </span>
            .
          </li>
          <li>Confirma. El icono «Pulso» quedará en el escritorio.</li>
        </ol>
      )}
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 text-sm text-primary underline"
      >
        Ocultar por ahora
      </button>
    </aside>
  );
}
