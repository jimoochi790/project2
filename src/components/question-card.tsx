"use client"

import { BookmarkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Question } from "@/types"

const OPTION_LABELS = ["A", "B", "C", "D"] as const

interface QuestionCardProps {
  question: Question
  selectedOption: string | null
  isFlagged: boolean
  onAnswer: (questionId: number, option: string) => void
  onFlag: (questionId: number) => void
}

export function QuestionCard({
  question,
  selectedOption,
  isFlagged,
  onAnswer,
  onFlag,
}: QuestionCardProps) {
  const options = [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-amber-400 text-xs font-medium uppercase tracking-wide">
            Question {question.question_number}
          </span>
          <h2 className="text-white text-lg leading-relaxed mt-1">
            {question.question_text}
          </h2>
        </div>
        <Button
          variant={isFlagged ? "default" : "ghost"}
          size="icon-sm"
          onClick={() => onFlag(question.id)}
          className={cn(
            "shrink-0 ml-4",
            isFlagged
              ? "bg-amber-400 text-[#1e293b] hover:bg-amber-300"
              : "text-slate-400 hover:text-amber-400 hover:bg-white/10"
          )}
          aria-label={isFlagged ? "Unflag question" : "Flag question"}
        >
          <BookmarkIcon
            className={cn("size-4", isFlagged && "fill-current")}
          />
        </Button>
      </div>

      <div className="grid gap-3">
        {options.map((text, i) => {
          const label = OPTION_LABELS[i]
          const isSelected = selectedOption === label

          return (
            <button
              key={label}
              onClick={() => onAnswer(question.id, label)}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/30"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  isSelected
                    ? "bg-amber-400 text-[#1e293b]"
                    : "bg-white/10 text-slate-300"
                )}
              >
                {label}
              </span>
              <span
                className={cn(
                  "text-base leading-relaxed pt-0.5",
                  isSelected ? "text-white" : "text-slate-300"
                )}
              >
                {text}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
