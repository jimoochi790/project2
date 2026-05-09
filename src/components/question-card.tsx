"use client"

import type { Question } from "@/types"

interface QuestionCardProps {
  question: Question
  selectedOption: string | null
  isFlagged: boolean
  onAnswer: (questionId: number, selected: string) => void
  onFlag?: (questionId: number) => void
  compact?: boolean
  dark?: boolean
}

export function QuestionCard({ question, selectedOption, isFlagged, onAnswer, onFlag, compact, dark }: QuestionCardProps) {
  const options = [
    { key: "A", text: question.option_a },
    { key: "B", text: question.option_b },
    { key: "C", text: question.option_c },
    { key: "D", text: question.option_d },
  ]

  const isDark = dark ?? true
  const textClass = isDark ? "text-slate-200" : "text-slate-700"
  const optionBase = isDark
    ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
  const optionSelected = isDark
    ? "border-blue-400/60 bg-blue-400/10 text-white"
    : "border-blue-500 bg-blue-50 text-blue-900"

  return (
    <div className={compact ? "max-w-2xl" : "max-w-3xl"}>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap mb-6 ${textClass}`}>
        {question.question_text}
      </p>

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key
          return (
            <label
              key={opt.key}
              onClick={() => onAnswer(question.id, opt.key)}
              className={`flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                isSelected ? optionSelected : optionBase
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={opt.key}
                checked={isSelected}
                onChange={() => onAnswer(question.id, opt.key)}
                className="mt-0.5 size-4 accent-blue-500"
              />
              <span className="text-sm leading-relaxed">
                <span className={`font-semibold mr-2 ${isDark ? "text-slate-400" : "text-slate-400"}`}>{opt.key}.</span>
                {opt.text}
              </span>
            </label>
          )
        })}
      </div>

      {onFlag && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onFlag(question.id)}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors ${
              isFlagged
                ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <svg className={`size-3.5 ${isFlagged ? "fill-amber-400 text-amber-500" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            {isFlagged ? "Flagged" : "Flag for review"}
          </button>
        </div>
      )}
    </div>
  )
}
