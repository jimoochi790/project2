"use client"

import { BookmarkIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type AnswerInfo = {
  selected: string | null
  isFlagged: boolean
}

interface QuestionNavProps {
  totalQuestions: number
  currentIndex: number
  answers: Record<number, AnswerInfo>
  onNavigate: (index: number) => void
}

export function QuestionNav({
  totalQuestions,
  currentIndex,
  answers,
  onNavigate,
}: QuestionNavProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: totalQuestions }, (_, i) => {
        const answer = answers[i]
        const isCurrent = i === currentIndex
        const isAnswered = !!answer?.selected
        const isFlagged = !!answer?.isFlagged

        return (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
              isCurrent && "bg-amber-400 text-[#1e293b] ring-2 ring-amber-400/40",
              !isCurrent && isAnswered && "bg-emerald-500/20 text-emerald-400",
              !isCurrent && !isAnswered && "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            )}
          >
            {i + 1}
            {isFlagged && (
              <BookmarkIcon className="absolute -top-1 -right-1 size-3 fill-amber-400 text-amber-400" />
            )}
          </button>
        )
      })}
    </div>
  )
}
