/** Chequeo diario e índice pulso_daily_v1 (T12). */

export const SCORE_VERSION = "pulso_daily_v1";
export const CHECKIN_TZ = "America/Mexico_City";

export type ScorePoint = 0 | 1 | 2 | 3 | 4;
/** null = «No sé / prefiero no responder» */
export type ScoreAnswer = ScorePoint | null;

export type AlarmAnswer = "yes" | "no" | "unsure";

export type CheckinAnswers = {
  alarm: AlarmAnswer | null;
  S1: ScoreAnswer;
  S2: ScoreAnswer;
  S3: ScoreAnswer;
  S4: ScoreAnswer;
  S5: ScoreAnswer;
  /** Quiere que un contacto le llame (fuera del puntaje) */
  wantContact: boolean | null;
};

export type ShareScope = "self" | "family";

export const SCORE_QUESTIONS: {
  id: "S1" | "S2" | "S3" | "S4" | "S5";
  prompt: string;
  options: [string, string, string, string, string];
}[] = [
  {
    id: "S1",
    prompt: "¿Qué tan descansada o descansado despertaste hoy?",
    options: ["Nada", "Poco", "Regular", "Bien", "Muy bien"],
  },
  {
    id: "S2",
    prompt: "¿Cuánta energía has tenido hoy?",
    options: ["Nada", "Poca", "Regular", "Buena", "Mucha"],
  },
  {
    id: "S3",
    prompt: "¿Cuánto te limitaron hoy el dolor o las molestias físicas?",
    options: ["Muchísimo", "Bastante", "Algo", "Poco", "Nada"],
  },
  {
    id: "S4",
    prompt: "¿Cómo ha estado tu ánimo hoy?",
    options: ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"],
  },
  {
    id: "S5",
    prompt: "¿Qué tan fácil fue hacer tus actividades habituales hoy?",
    options: [
      "No pude",
      "Muy difícil",
      "Con dificultad",
      "Casi normal",
      "Como siempre",
    ],
  },
];

export const ALARM_PROMPT =
  "¿Tienes ahora dificultad para respirar, dolor o presión en el pecho que no cede, confusión repentina, debilidad repentina de un lado del cuerpo o no puedes mantenerte despierta o despierto?";

export const EMPTY_ANSWERS: CheckinAnswers = {
  alarm: null,
  S1: null,
  S2: null,
  S3: null,
  S4: null,
  S5: null,
  wantContact: null,
};

/** Día civil en CDMX como Date UTC a medianoche (para @db.Date). */
export function localDayCDMX(now = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHECKIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function formatLocalDay(day: Date): string {
  return day.toISOString().slice(0, 10);
}

/**
 * puntaje = 5 × (S1+…+S5), 0–100.
 * Si falta alguna respuesta puntuable → null («Sin puntaje hoy»).
 * «No sé» nunca cuenta como cero.
 */
export function computePulsoDailyScore(
  answers: Pick<CheckinAnswers, "S1" | "S2" | "S3" | "S4" | "S5">,
): number | null {
  const vals = [answers.S1, answers.S2, answers.S3, answers.S4, answers.S5];
  if (vals.some((v) => v === null || v === undefined)) return null;
  const sum = (vals as ScorePoint[]).reduce((a, b) => a + b, 0);
  return 5 * sum;
}

export function averageRecentScores(
  scores: number[],
  maxDays = 7,
): { average: number; daysUsed: number } | null {
  const recent = scores.filter((n) => Number.isFinite(n)).slice(0, maxDays);
  if (recent.length < 3) return null;
  const average = Math.round(
    recent.reduce((a, b) => a + b, 0) / recent.length,
  );
  return { average, daysUsed: recent.length };
}

export function scoreDisclaimer(score: number | null): string {
  if (score === null) {
    return "Sin puntaje hoy: hace falta responder las cinco preguntas (o elegiste «No sé» en alguna).";
  }
  return "Compáralo con tus propios días; si te preocupa cómo te sientes, contacta a alguien de confianza o a un profesional. No es un diagnóstico.";
}

export function serializeAnswers(answers: CheckinAnswers): string {
  return JSON.stringify(answers);
}

export function parseAnswers(raw: string): CheckinAnswers {
  try {
    const parsed = JSON.parse(raw) as Partial<CheckinAnswers>;
    return {
      ...EMPTY_ANSWERS,
      ...parsed,
    };
  } catch {
    return { ...EMPTY_ANSWERS };
  }
}
