"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Timer } from "@/components/timer"
import { QuestionCard } from "@/components/question-card"
import { ProgressSummary } from "@/components/progress-summary"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { ChevronLeftIcon, ChevronRightIcon, FlagIcon, InfoIcon, AlertTriangleIcon } from "lucide-react"
import { toast } from "sonner"
import type { Question, TestSet, TestAttempt } from "@/types"

type AnswerInfo = { selected: string | null; isFlagged: boolean }

export default function TakeTestPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const testSetId = Number(params.id)

  const [testSet, setTestSet] = useState<TestSet | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [attempt, setAttempt] = useState<TestAttempt | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, AnswerInfo>>({})
  const [visited, setVisited] = useState<Set<number>>(new Set([0]))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showFinishDialog, setShowFinishDialog] = useState(false)

  const initRef = useRef(false)
  const submitRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    const supabase = createClient()

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      const isAdmin = profile?.role === "admin"

      const { data: ts } = await supabase.from("test_sets").select("*").eq("id", testSetId).single()
      if (!ts) { toast.error("Test not found"); router.push("/account"); return }

      if (!isAdmin) {
        const { data: purchase } = await supabase.from("purchases").select("id").eq("user_id", user.id).eq("test_set_id", testSetId).maybeSingle()
        if (!purchase) { toast.error("You need to purchase this test first"); router.push(`/tests/${testSetId}`); return }
      }

      setTestSet(ts)

      const { data: qs } = await supabase.from("questions").select("*").eq("test_set_id", testSetId).order("sort_order", { ascending: true })
      const questionList = qs ?? []
      setQuestions(questionList)

      const { data: attemptData, error: attemptErr } = await supabase.from("test_attempts").insert({
        user_id: user.id, test_set_id: testSetId, started_at: new Date().toISOString(),
        total_questions: questionList.length, status: "in_progress",
      }).select().single()

      if (attemptErr) { toast.error("Failed to start test"); router.push("/account"); return }
      setAttempt(attemptData)
      setLoading(false)
    }
    init()
  }, [testSetId, router])

  const saveAnswer = useCallback(async (questionId: number, selected: string) => {
    if (!attempt) return
    const supabase = createClient()
    await supabase.from("attempt_answers").upsert({
      attempt_id: attempt.id, question_id: questionId, selected_option: selected,
      is_flagged: false, answered_at: new Date().toISOString(),
    }, { onConflict: "attempt_id,question_id" })
  }, [attempt])

  const handleAnswer = useCallback((questionId: number, selected: string) => {
    const idx = currentIndex
    setAnswers((prev) => ({ ...prev, [idx]: { selected, isFlagged: prev[idx]?.isFlagged ?? false } }))
    setVisited((prev) => new Set(prev).add(idx))
    saveAnswer(questionId, selected)
  }, [currentIndex, saveAnswer])

  const handleFlag = useCallback(() => {
    const idx = currentIndex
    const current = answers[idx] ?? { selected: null, isFlagged: false }
    const newFlagged = !current.isFlagged
    setAnswers((prev) => ({ ...prev, [idx]: { ...current, isFlagged: newFlagged } }))

    const question = questions[idx]
    if (question && attempt) {
      const supabase = createClient()
      supabase.from("attempt_answers").upsert({
        attempt_id: attempt.id, question_id: question.id, selected_option: current.selected,
        is_flagged: newFlagged, answered_at: current.selected ? new Date().toISOString() : null,
      }, { onConflict: "attempt_id,question_id" })
    }
  }, [currentIndex, answers, questions, attempt])

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= questions.length) return
    setCurrentIndex(index)
    setVisited((prev) => new Set(prev).add(index))
  }, [questions.length])

  const handleBack = () => goTo(currentIndex - 1)
  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      setShowFinishDialog(true)
    } else {
      goTo(currentIndex + 1)
    }
  }

  const handleFinish = useCallback(async () => {
    if (!attempt || !testSet || submitRef.current) return
    submitRef.current = true
    setSubmitting(true)
    setShowFinishDialog(false)

    const supabase = createClient()
    let correctCount = 0

    for (const q of questions) {
      const idx = q.question_number - 1
      const answer = answers[idx]
      const selected = answer?.selected ?? null
      const isCorrect = selected === q.correct_option
      if (isCorrect) correctCount++

      await supabase.from("attempt_answers").upsert({
        attempt_id: attempt.id, question_id: q.id, selected_option: selected,
        is_correct: selected ? isCorrect : null, is_flagged: answer?.isFlagged ?? false,
        answered_at: selected ? new Date().toISOString() : null,
      }, { onConflict: "attempt_id,question_id" })
    }

    await supabase.from("test_attempts").update({
      score: correctCount, completed_at: new Date().toISOString(), status: "completed",
    }).eq("id", attempt.id)

    toast.success("Test submitted!")
    router.push(`/tests/${testSetId}/results/${attempt.id}`)
  }, [attempt, testSet, questions, answers, testSetId, router])

  const handleTimeUp = useCallback(() => {
    if (submitRef.current) return
    toast.warning("Time's up! Your test will be submitted.")
    handleFinish()
  }, [handleFinish])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <div className="size-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      </div>
    )
  }

  if (!testSet || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <p className="text-slate-400">Test not found.</p>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers[currentIndex] ?? { selected: null, isFlagged: false }
  const answeredCount = Object.values(answers).filter((a) => a.selected).length
  const unansweredCount = questions.length - answeredCount

  // Reading tests have passage prepended to question_text (split by \n\n)
  const parts = currentQuestion?.question_text?.split("\n\n") ?? []
  const isReading = parts.length >= 2 || (currentQuestion?.question_text?.length ?? 0) > 500

  return (
    <div className="flex flex-col h-screen bg-white text-slate-800">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b bg-white px-4 h-10 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Instructions - could link to a modal */}}
            className="h-auto px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <InfoIcon className="size-3.5 mr-1" />
            Instructions
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSummary(true)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span className="font-semibold">Question {currentIndex + 1}</span>
            <span className="text-slate-400">of {questions.length}</span>
            <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <Timer durationMinutes={testSet.duration_minutes} onTimeUp={handleTimeUp} />
        </div>

        <div className="w-20" /> {/* spacer for balance */}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex">
        {isReading ? (
          // Two-column layout for reading tests
          <>
            <div className="w-1/2 overflow-auto border-r p-6">
              <div className="max-w-lg mx-auto">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                  {parts[0]}
                </div>
              </div>
            </div>
            <div className="w-1/2 overflow-auto p-6">
              <div className="max-w-lg mx-auto">
                <p className="text-sm text-slate-500 mb-2">{parts[1] || "Choose the correct answer:"}</p>
                {currentQuestion && (
                  <QuestionCard
                    question={currentQuestion}
                    selectedOption={currentAnswer.selected}
                    isFlagged={currentAnswer.isFlagged}
                    onAnswer={handleAnswer}
                    onFlag={undefined}
                    dark={false}
                    compact
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          // Single-column layout for math/thinking
          <div className="flex-1 overflow-auto p-6 flex justify-center">
            <div className="w-full max-w-3xl">
              {currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  selectedOption={currentAnswer.selected}
                  isFlagged={currentAnswer.isFlagged}
                  onAnswer={handleAnswer}
                  onFlag={undefined}
                  dark={false}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Footer Bar */}
      <footer className="flex items-center justify-between border-t bg-white px-4 h-12 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFlag}
            className={`text-sm transition-colors ${
              currentAnswer.isFlagged
                ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <FlagIcon className={`size-4 mr-1 ${currentAnswer.isFlagged ? "fill-amber-400 text-amber-400" : ""}`} />
            {currentAnswer.isFlagged ? "Flagged" : "Flag this question"}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          {currentIndex >= questions.length - 1 ? "Finish" : "Next"}
          <ChevronRightIcon className="size-4 ml-1" />
        </Button>
      </footer>

      {/* Progress Summary Overlay */}
      {showSummary && (
        <ProgressSummary
          totalQuestions={questions.length}
          currentIndex={currentIndex}
          answers={answers}
          visitedQuestions={visited}
          onNavigate={goTo}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Finish Confirmation Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Finish Test</DialogTitle>
            <DialogDescription>
              <div className="space-y-3 mt-2">
                {unansweredCount > 0 && (
                  <p className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertTriangleIcon className="size-4 shrink-0" />
                    You have {unansweredCount} unanswered question{unansweredCount !== 1 ? "s" : ""}.
                  </p>
                )}
                <p className="text-sm text-slate-500">
                  You have answered {answeredCount} of {questions.length} questions.
                </p>
                <p className="text-sm text-slate-500">
                  Once you finish, you cannot change your answers. Make sure to review any flagged questions before finishing.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Go Back
            </DialogClose>
            <Button
              onClick={handleFinish}
              disabled={submitting}
              className="bg-blue-600 font-medium text-white hover:bg-blue-500"
            >
              {submitting ? "Submitting..." : "Finish Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
