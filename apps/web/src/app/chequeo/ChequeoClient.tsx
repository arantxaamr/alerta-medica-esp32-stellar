"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  ALARM_PROMPT,
  EMPTY_ANSWERS,
  SCORE_QUESTIONS,
  SCORE_VERSION,
  computePulsoDailyScore,
  scoreDisclaimer,
  type AlarmAnswer,
  type CheckinAnswers,
  type ScoreAnswer,
  type ShareScope,
} from "@/lib/checkin";

type HistoryItem = {
  id: string;
  localDay: string;
  score0100: number | null;
};

type Step =
  | "intro"
  | "alarm"
  | "alarm_help"
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "contact"
  | "summary"
  | "done";

const SCORE_STEPS: Step[] = ["S1", "S2", "S3", "S4", "S5"];

export function ChequeoClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<CheckinAnswers>({ ...EMPTY_ANSWERS });
  const [shareScope, setShareScope] = useState<ShareScope>("self");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [trend, setTrend] = useState<{
    average: number;
    daysUsed: number;
  } | null>(null);
  const [savedScore, setSavedScore] = useState<number | null | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/checkins")
      .then((r) => r.json())
      .then((d) => {
        if (d.today) {
          setAnswers(d.today.answers);
          setShareScope(d.today.shareScope || "self");
          setSavedScore(d.today.score0100);
        }
        setHistory(d.history || []);
        setTrend(d.trend || null);
      })
      .catch(() => setError("No se pudo cargar el chequeo"))
      .finally(() => setLoaded(true));
  }, []);

  function setScore(id: "S1" | "S2" | "S3" | "S4" | "S5", value: ScoreAnswer) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function nextAfterScore(current: "S1" | "S2" | "S3" | "S4" | "S5") {
    const idx = SCORE_STEPS.indexOf(current);
    const next = SCORE_STEPS[idx + 1];
    setStep(next || "contact");
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, shareScope }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar");
        return;
      }
      setSavedScore(data.checkin.score0100);
      setTrend(data.trend || null);
      setHistory((h) => {
        const rest = h.filter((x) => x.localDay !== data.checkin.localDay);
        return [
          {
            id: data.checkin.id,
            localDay: data.checkin.localDay,
            score0100: data.checkin.score0100,
          },
          ...rest,
        ].slice(0, 14);
      });
      setStep("done");
    });
  }

  if (!loaded) {
    return <p className="text-text-secondary">Cargando chequeo…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/ayuda" className="text-danger underline">
          Necesito ayuda ahora
        </Link>
        <a href="tel:911" className="text-danger underline">
          Llamar al 911
        </a>
      </div>

      {step === "intro" ? (
        <section className="space-y-4">
          <p className="text-text-secondary">
            Cinco preguntas breves sobre cómo te sientes hoy. Es opcional y no
            es un diagnóstico. Índice {SCORE_VERSION}.
          </p>
          {savedScore !== undefined && savedScore !== null ? (
            <p className="rounded-xl border border-border bg-surface p-4 text-text">
              Ya guardaste un chequeo hoy
              {typeof savedScore === "number"
                ? `: bienestar reportado ${savedScore}/100`
                : " (sin puntaje completo)"}
              . Puedes actualizarlo.
            </p>
          ) : null}
          <button
            type="button"
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary font-medium text-white"
            onClick={() => setStep("alarm")}
          >
            Empezar chequeo
          </button>
          <button
            type="button"
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-border font-medium text-text"
            onClick={() => router.push("/inicio")}
          >
            Omitir este chequeo
          </button>
        </section>
      ) : null}

      {step === "alarm" ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-text">Antes de seguir</h2>
          <p className="text-text-secondary">{ALARM_PROMPT}</p>
          {(
            [
              ["yes", "Sí"],
              ["no", "No"],
              ["unsure", "No estoy seguro/a"],
            ] as [AlarmAnswer, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-border bg-surface font-medium text-text"
              onClick={() => {
                setAnswers((a) => ({ ...a, alarm: value }));
                setStep(value === "no" ? "S1" : "alarm_help");
              }}
            >
              {label}
            </button>
          ))}
        </section>
      ) : null}

      {step === "alarm_help" ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-danger">Pide ayuda ahora</h2>
          <p className="text-text-secondary">
            No esperes al puntaje del chequeo. Si puedes, llama al 911 o avisa a
            tu red de apoyo.
          </p>
          <a
            href="tel:911"
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-danger font-semibold text-white"
          >
            Llamar al 911
          </a>
          <Link
            href="/ayuda"
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary font-semibold text-white"
          >
            Pedir ayuda a mi familia
          </Link>
          <button
            type="button"
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-border font-medium text-text"
            onClick={() => setStep("S1")}
          >
            Continuar el chequeo de todos modos
          </button>
        </section>
      ) : null}

      {SCORE_STEPS.includes(step) ? (
        <ScoreStep
          step={step as "S1" | "S2" | "S3" | "S4" | "S5"}
          value={answers[step as "S1" | "S2" | "S3" | "S4" | "S5"]}
          onPick={(v) => {
            setScore(step as "S1" | "S2" | "S3" | "S4" | "S5", v);
            nextAfterScore(step as "S1" | "S2" | "S3" | "S4" | "S5");
          }}
          onBack={() => {
            const idx = SCORE_STEPS.indexOf(step);
            setStep(idx <= 0 ? "alarm" : SCORE_STEPS[idx - 1]);
          }}
        />
      ) : null}

      {step === "contact" ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-text">
            ¿Quieres que uno de tus contactos te llame hoy?
          </h2>
          <p className="text-sm text-text-secondary">
            Esto no es una emergencia. Solo avisa a tu familiar de confianza.
          </p>
          <button
            type="button"
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary font-medium text-white"
            onClick={() => {
              setAnswers((a) => ({ ...a, wantContact: true }));
              setStep("summary");
            }}
          >
            Sí, que me llamen
          </button>
          <button
            type="button"
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-border font-medium text-text"
            onClick={() => {
              setAnswers((a) => ({ ...a, wantContact: false }));
              setStep("summary");
            }}
          >
            No, gracias
          </button>
        </section>
      ) : null}

      {step === "summary" ? (
        <SummaryStep
          answers={answers}
          shareScope={shareScope}
          setShareScope={setShareScope}
          trend={trend}
          pending={pending}
          error={error}
          onBack={() => setStep("contact")}
          onSave={save}
        />
      ) : null}

      {step === "done" ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-text">Chequeo guardado</h2>
          {savedScore === null || savedScore === undefined ? (
            <p className="text-text-secondary">{scoreDisclaimer(null)}</p>
          ) : (
            <>
              <p className="text-[28px] font-semibold text-text">
                Tu bienestar reportado hoy: {savedScore}/100
              </p>
              <p className="text-text-secondary">
                {scoreDisclaimer(savedScore)}
              </p>
            </>
          )}
          {trend ? (
            <p className="text-sm text-text-secondary">
              Promedio de tus últimos {trend.daysUsed} chequeos completos:{" "}
              {trend.average}/100 (solo referencia personal).
            </p>
          ) : null}
          <HistoryList history={history} />
          <Link
            href="/inicio"
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary font-medium text-white"
          >
            Volver al inicio
          </Link>
        </section>
      ) : null}
    </div>
  );
}

function ScoreStep({
  step,
  value,
  onPick,
  onBack,
}: {
  step: "S1" | "S2" | "S3" | "S4" | "S5";
  value: ScoreAnswer;
  onPick: (v: ScoreAnswer) => void;
  onBack: () => void;
}) {
  const q = SCORE_QUESTIONS.find((x) => x.id === step)!;
  const idx = SCORE_STEPS.indexOf(step) + 1;
  return (
    <section className="space-y-4">
      <p className="text-sm text-text-secondary">
        Pregunta {idx} de 5 · Puedes omitir con «No sé»
      </p>
      <h2 className="text-xl font-semibold text-text">{q.prompt}</h2>
      <div className="flex flex-col gap-2">
        {q.options.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`flex min-h-[52px] w-full items-center justify-center rounded-xl border px-4 font-medium ${
              value === i
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text"
            }`}
            onClick={() => onPick(i as 0 | 1 | 2 | 3 | 4)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-dashed border-border text-text-secondary"
          onClick={() => onPick(null)}
        >
          No sé / prefiero no responder
        </button>
      </div>
      <button
        type="button"
        className="text-sm text-text-secondary underline"
        onClick={onBack}
      >
        Atrás
      </button>
    </section>
  );
}

function SummaryStep({
  answers,
  shareScope,
  setShareScope,
  trend,
  pending,
  error,
  onBack,
  onSave,
}: {
  answers: CheckinAnswers;
  shareScope: ShareScope;
  setShareScope: (s: ShareScope) => void;
  trend: { average: number; daysUsed: number } | null;
  pending: boolean;
  error: string | null;
  onBack: () => void;
  onSave: () => void;
}) {
  const preview = computePulsoDailyScore(answers);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-text">Resumen</h2>
      {preview === null ? (
        <p className="text-text-secondary">{scoreDisclaimer(null)}</p>
      ) : (
        <p className="text-text">
          Bienestar reportado (vista previa):{" "}
          <strong>{preview}/100</strong>
        </p>
      )}
      <p className="text-sm text-text-secondary">{scoreDisclaimer(preview)}</p>
      {answers.wantContact ? (
        <p className="text-sm text-text-secondary">
          Pediste que un contacto te llame hoy.
        </p>
      ) : null}
      {trend ? (
        <p className="text-sm text-text-secondary">
          Tu promedio reciente ({trend.daysUsed} días): {trend.average}/100.
        </p>
      ) : null}

      <fieldset className="space-y-2 rounded-xl border border-border p-4">
        <legend className="px-1 font-medium text-text">
          ¿Quién puede ver este chequeo?
        </legend>
        <label className="flex gap-2 text-text">
          <input
            type="radio"
            name="share"
            checked={shareScope === "self"}
            onChange={() => setShareScope("self")}
          />
          Solo yo
        </label>
        <label className="flex gap-2 text-text">
          <input
            type="radio"
            name="share"
            checked={shareScope === "family"}
            onChange={() => setShareScope("family")}
          />
          Yo y mis familiares verificados (solo el índice, no el detalle)
        </label>
      </fieldset>

      {error ? (
        <p className="text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={onSave}
        className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary font-medium text-white disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar chequeo"}
      </button>
      <button
        type="button"
        className="text-sm text-text-secondary underline"
        onClick={onBack}
      >
        Atrás
      </button>
    </section>
  );
}

function HistoryList({ history }: { history: HistoryItem[] }) {
  if (history.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="font-semibold text-text">Historial reciente</h3>
      <ul className="mt-2 space-y-1 text-sm text-text-secondary">
        {history.map((h) => (
          <li key={h.id}>
            {h.localDay}:{" "}
            {h.score0100 === null ? "Sin puntaje" : `${h.score0100}/100`}
          </li>
        ))}
      </ul>
    </div>
  );
}
