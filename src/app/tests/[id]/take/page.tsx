"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Timer } from "@/components/timer"
import { QuestionNav } from "@/components/question-nav"
import { QuestionCard } from "@/components/question-card"
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
import { ClockIcon, AlertTriangleIcon, BookmarkIcon } from "lucide-react"
import { toast } from "sonner"
import type { Question, TestSet, TestAttempt } from "@/types"

type AnswerInfo = {
  selected: string | null
  isFlagged: boolean
}

export default function TakeTestPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const testSetId = Number(params.id)

  const [testSet, setTestSet] = useState<TestSet | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [attempt, setAttempt] = useState<TestAttempt | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, AnswerInfo>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  const initRef = useRef(false)
  const submitRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const supabase = createClient()

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: ts } = await supabase
        .from("test_sets")
        .select("*")
        .eq("id", testSetId)
        .single()

      if (!ts) {
        toast.error("Test not found")
        router.push("/account")
        return
      }
      setTestSet(ts)

      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("test_set_id", testSetId)
        .order("sort_order", { ascending: true })

      const questionList = qs ?? []
      setQuestions(questionList)

      const { data: attemptData, error: attemptErr } = await supabase
        .from("test_attempts")
        .insert({
          user_id: user.id,
          test_set_id: testSetId,
          started_at: new Date().toISOString(),
          total_questions: questionList.length,
          status: "in_progress",
        })
        .select()
        .single()

      if (attemptErr) {
        toast.error("Failed to start test")
        router.push("/account")
        return
      }

      setAttempt(attemptData)
      setLoading(false)
    }

    init()
  }, [testSetId, router])

  const saveAnswer = useCallback(
    async (questionId: number, selected: string) => {
      if (!attempt) return
      const supabase = createClient()
      await supabase.from("attempt_answers").upsert(
        {
          attempt_id: attempt.id,
          question_id: questionId,
          selected_option: selected,
          is_flagged: false,
          answered_at: new Date().toISOString(),
        },
        { onConflict: "attempt_id,question_id" }
      )
    },
    [attempt]
  )

  const handleAnswer = useCallback(
    (questionId: number, selected: string) => {
      const question = questions.find((q) => q.id === questionId)
      if (!question) return

      const idx = question.question_number - 1
      setAnswers((prev) => ({
        ...prev,
        [idx]: { selected, isFlagged: prev[idx]?.isFlagged ?? false },
      }))

      saveAnswer(questionId, selected)
    },
    [questions, saveAnswer]
  )

  const handleFlag = useCallback(
    (questionId: number) => {
      const question = questions.find((q) => q.id === questionId)
      if (!question) return

      const idx = question.question_number - 1
      setAnswers((prev) => {
        const current = prev[idx] ?? { selected: null, isFlagged: false }
        const newFlagged = !current.isFlagged

        if (attempt) {
          const supabase = createClient()
          supabase.from("attempt_answers").upsert(
            {
              attempt_id: attempt.id,
              question_id: questionId,
              selected_option: current.selected,
              is_flagged: newFlagged,
              answered_at: current.selected ? new Date().toISOString() : null,
            },
            { onConflict: "attempt_id,question_id" }
          )
        }

        return { ...prev, [idx]: { ...current, isFlagged: newFlagged } }
      })
    },
    [questions, attempt]
  )

  const handleSubmit = useCallback(async () => {
    if (!attempt || !testSet || submitRef.current) return
    submitRef.current = true
    setSubmitting(true)

    const supabase = createClient()
    let correctCount = 0

    for (const q of questions) {
      const idx = q.question_number - 1
      const answer = answers[idx]
      const selected = answer?.selected ?? null
      const isCorrect = selected === q.correct_option
      if (isCorrect) correctCount++

      await supabase.from("attempt_answers").upsert(
        {
          attempt_id: attempt.id,
          question_id: q.id,
          selected_option: selected,
          is_correct: selected ? isCorrect : null,
          is_flagged: answer?.isFlagged ?? false,
          answered_at: selected ? new Date().toISOString() : null,
        },
        { onConflict: "attempt_id,question_id" }
      )
    }

    await supabase
      .from("test_attempts")
      .update({
        score: correctCount,
        completed_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", attempt.id)

    toast.success("Test submitted!")
    router.push(`/tests/${testSetId}/results/${attempt.id}`)
  }, [attempt, testSet, questions, answers, testSetId, router])

  const handleTimeUp = useCallback(() => {
    if (submitRef.current) return
    toast.warning("Time's up! Your test will be submitted automatically.")
    setShowSubmitDialog(false)
    handleSubmit()
  }, [handleSubmit])

  const handleNavigate = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    )
  }

  if (!testSet || questions.length === 0) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <p className="text-slate-400">Test not found.</p>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.values(answers).filter((a) => a.selected).length
  const unansweredCount = questions.length - answeredCount

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0f172a]">
      <div className="sticky top-14 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#1e293b] px-4">
        <div>
          <h1 className="text-sm font-medium text-white">{testSet.name}</h1>
          <p className="text-xs text-slate-400">
            {answeredCount} of {questions.length} answered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ClockIcon className="size-4 text-slate-400" />
          <Timer
            durationMinutes={testSet.duration_minutes}
            onTimeUp={handleTimeUp}
          />
        </div>
        <Button
          onClick={() => setShowSubmitDialog(true)}
          className="bg-amber-400 font-medium text-[#1e293b] hover:bg-amber-300"
        >
          Submit Test
        </Button>
      </div>

      <div className="flex h-[calc(100vh-7rem)]">
        <div className="flex-1 overflow-auto p-6">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              selectedOption={answers[currentIndex]?.selected ?? null}
              isFlagged={answers[currentIndex]?.isFlagged ?? false}
              onAnswer={handleAnswer}
              onFlag={handleFlag}
            />
          )}
        </div>

        <div className="w-72 overflow-auto border-l border-white/10 bg-[#1e293b] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Questions</h3>
            <span className="text-xs text-slate-400">
              {answeredCount}/{questions.length}
            </span>
          </div>

          <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-emerald-500/30" />{" "}
              Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-white/10" /> Unanswered
            </span>
            <span className="flex items-center gap-1">
              <BookmarkIcon className="size-3 fill-amber-400 text-amber-400" />{" "}
              Flagged
            </span>
          </div>

          <QuestionNav
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answers={answers}
            onNavigate={handleNavigate}
          />

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Answered</span>
                <span className="text-emerald-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Unanswered</span>
                <span className="text-red-400">{unansweredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Flagged</span>
                <span className="text-amber-400">
                  {Object.values(answers).filter((a) => a.isFlagged).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Test</DialogTitle>
            <DialogDescription>
              <div className="space-y-2">
                {unansweredCount > 0 && (
                  <p className="flex items-center gap-2 text-amber-500">
                    <AlertTriangleIcon className="size-4" />
                    You have {unansweredCount} unanswered question
                    {unansweredCount !== 1 ? "s" : ""}.
                  </p>
                )}
                <p>You cannot change your answers after submission.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={() => {
                setShowSubmitDialog(false)
                handleSubmit()
              }}
              disabled={submitting}
              className="bg-amber-400 font-medium text-[#1e293b] hover:bg-amber-300"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
