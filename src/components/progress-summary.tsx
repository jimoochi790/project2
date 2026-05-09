"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { XIcon, FlagIcon } from "lucide-react"

interface QuestionStatus {
  index: number
  status: "not-read" | "not-answered" | "answered" | "flagged"
}

interface ProgressSummaryProps {
  totalQuestions: number
  currentIndex: number
  answers: Record<number, { selected: string | null; isFlagged: boolean }>
  visitedQuestions: Set<number>
  onNavigate: (index: number) => void
  onClose: () => void
}

export function ProgressSummary({
  totalQuestions,
  currentIndex,
  answers,
  visitedQuestions,
  onNavigate,
  onClose,
}: ProgressSummaryProps) {
  const [filter, setFilter] = useState<"all" | "answered" | "not-answered" | "not-read" | "flagged">("all")

  const getStatus = (idx: number): QuestionStatus["status"] => {
    const a = answers[idx]
    if (a?.isFlagged) return "flagged"
    if (a?.selected) return "answered"
    if (visitedQuestions.has(idx)) return "not-answered"
    return "not-read"
  }

  const allQuestions = Array.from({ length: totalQuestions }, (_, i) => ({
    index: i,
    status: getStatus(i),
  }))

  const counts = {
    all: totalQuestions,
    answered: allQuestions.filter((q) => q.status === "answered").length,
    "not-answered": allQuestions.filter((q) => q.status === "not-answered").length,
    "not-read": allQuestions.filter((q) => q.status === "not-read").length,
    flagged: allQuestions.filter((q) => q.status === "flagged" || answers[q.index]?.isFlagged).length,
  }

  const filters = [
    { key: "all" as const, label: "Show all", count: counts.all },
    { key: "answered" as const, label: "Answered", count: counts.answered },
    { key: "not-answered" as const, label: "Not answered", count: counts["not-answered"] },
    { key: "not-read" as const, label: "Not read", count: counts["not-read"] },
    { key: "flagged" as const, label: "Flagged", count: counts.flagged },
  ]

  const filtered = filter === "all"
    ? allQuestions
    : allQuestions.filter((q) => {
        if (filter === "flagged") return q.status === "flagged" || answers[q.index]?.isFlagged
        return q.status === filter
      })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/95 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-[#1e293b] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Progress summary</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <XIcon className="size-5" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 px-6 pt-4 pb-2" role="group" aria-label="Click a button below to apply a filter to the question list.">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              <span className="font-semibold">{f.count}</span>
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3 px-6 py-4 max-h-96 overflow-auto">
          {filtered.map((q) => {
            const isCurrent = q.index === currentIndex
            const a = answers[q.index]
            const status = q.status

            let bg = "bg-white/5 border-white/10"
            let text = "text-slate-400"
            let label = "Not answered"

            if (isCurrent) {
              bg = "bg-blue-500/20 border-blue-500/40"
              text = "text-blue-300"
              label = status === "answered" ? "" : "Current"
            } else if (status === "answered") {
              bg = "bg-emerald-500/20 border-emerald-500/30"
              text = "text-emerald-300"
              label = "Answered"
            } else if (status === "flagged" || a?.isFlagged) {
              bg = "bg-amber-500/20 border-amber-500/30"
              text = "text-amber-300"
              label = "Flagged"
            } else if (status === "not-read") {
              bg = "bg-white/5 border-white/10"
              text = "text-slate-500"
              label = "Not read"
            }

            return (
              <button
                key={q.index}
                onClick={() => { onNavigate(q.index); onClose() }}
                className={`flex flex-col items-center justify-center rounded-lg border p-3 transition-colors hover:brightness-125 ${bg} ${text}`}
              >
                <span className="text-lg font-bold">{q.index + 1}</span>
                <span className="text-[10px] leading-tight text-center mt-0.5 opacity-75">{label}</span>
                {a?.isFlagged && <FlagIcon className="size-3 mt-0.5 text-amber-400" />}
              </button>
            )
          })}
        </div>

        <div className="flex justify-end border-t border-white/10 px-6 py-3">
          <Button
            onClick={onClose}
            className="bg-amber-400 font-medium text-[#1e293b] hover:bg-amber-300"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
