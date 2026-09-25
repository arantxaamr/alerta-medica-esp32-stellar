"use client";

import { useMemo, useState } from "react";

const questions = [
  { id: "sleep", label: "¿Cómo dormiste?", low: "Poco o mal", high: "Muy bien" },
  { id: "mood", label: "¿Cómo te sientes hoy?", low: "Con dificultad", high: "Muy bien" },
  { id: "pain", label: "¿Tienes dolor o molestias?", low: "Mucho", high: "Nada" },
  { id: "energy", label: "¿Cómo está tu energía?", low: "Muy baja", high: "Muy buena" },
] as const;

export function CheckinPreview() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const answered = Object.keys(answers).length;
  const score = useMemo(() => answered ? Math.round(Object.values(answers).reduce((total, value) => total + value, 0) / (answered * 5) * 100) : 0, [answers, answered]);
  const complete = answered === questions.length;

  return <section className="checkin-preview" aria-labelledby="checkin-title">
    <div className="checkin-heading"><div><span className="panel-kicker">VISTA PREVIA · NO GUARDA DATOS</span><h2 id="checkin-title">Tu chequeo de hoy</h2><p>Elige una respuesta del 1 al 5 en cada pregunta.</p></div><div className={`score-orb ${complete ? "complete" : ""}`} aria-live="polite"><strong>{complete ? score : answered}</strong><span>{complete ? "de 100" : `de ${questions.length}`}</span></div></div>
    <div className="question-list">{questions.map((question, index) => <fieldset key={question.id}><legend><span>{String(index + 1).padStart(2, "0")}</span>{question.label}</legend><div className="scale-labels"><small>{question.low}</small><small>{question.high}</small></div><div className="answer-scale">{[1,2,3,4,5].map(value => <button type="button" key={value} className={answers[question.id] === value ? "selected" : ""} onClick={() => setAnswers(current => ({ ...current, [question.id]: value }))} aria-label={`${question.label}: ${value} de 5`} aria-pressed={answers[question.id] === value}>{value}</button>)}</div></fieldset>)}</div>
    {complete ? <div className="score-result" role="status"><span>✓</span><div><strong>Indicador de bienestar: {score}/100</strong><p>Este resultado refleja tus respuestas de hoy y serviría para conversar con tu red. No es un diagnóstico médico.</p></div></div> : <p className="checkin-progress">Responde {questions.length - answered} {questions.length - answered === 1 ? "pregunta más" : "preguntas más"} para ver el indicador de ejemplo.</p>}
    {answered > 0 && <button type="button" className="plain-button" onClick={() => setAnswers({})}>Limpiar respuestas</button>}
  </section>;
}
