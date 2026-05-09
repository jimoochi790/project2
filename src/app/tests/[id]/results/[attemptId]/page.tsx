import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/utils"
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon, RotateCcwIcon, ClockIcon, TargetIcon, CalendarIcon } from "lucide-react"
import type { TestAttempt, TestSet, Question, AttemptAnswer } from "@/types"

interface Props {
  params: Promise<{ id: string; attemptId: string }>
}

export default async function ResultsPage({ params }: Props) {
  const { id, attemptId } = await params
  const testSetId = Number(id)
  const attemptIdNum = Number(attemptId)

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("id", attemptIdNum)
    .eq("user_id", user.id)
    .single()

  if (!attempt) redirect("/account")

  const { data: testSet } = await supabase
    .from("test_sets")
    .select("*")
    .eq("id", testSetId)
    .single()

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("test_set_id", testSetId)
    .order("sort_order", { ascending: true })

  const { data: attemptAnswers } = await supabase
    .from("attempt_answers")
    .select("*")
    .eq("attempt_id", attemptIdNum)
    .order("question_id", { ascending: true })

  const typedAttempt = attempt as TestAttempt
  const typedTestSet = testSet as TestSet | null
  const typedQuestions = (questions ?? []) as Question[]
  const typedAnswers = (attemptAnswers ?? []) as AttemptAnswer[]

  const answerMap = new Map<number, AttemptAnswer>()
  for (const a of typedAnswers) answerMap.set(a.question_id, a)

  const score = typedAttempt.score ?? 0
  const total = typedAttempt.total_questions
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  const startedAt = new Date(typedAttempt.started_at)
  const completedAt = typedAttempt.completed_at ? new Date(typedAttempt.completed_at) : new Date()
  const timeMs = completedAt.getTime() - startedAt.getTime()
  const timeMinutes = Math.round(timeMs / 60000)

  const correctCount = typedAnswers.filter(a => a.is_correct).length
  const incorrectCount = typedAnswers.filter(a => a.selected_option && !a.is_correct).length
  const skippedCount = typedAnswers.filter(a => !a.selected_option).length

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-600"
    if (pct >= 60) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{typedTestSet?.name ?? "Test"} — Results</h1>
            <Badge variant="outline" className="text-xs">
              {typedAttempt.status === "completed" ? "Completed" : typedAttempt.status === "timed_out" ? "Timed Out" : "In Progress"}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{typedTestSet?.description}</p>
        </div>

        {/* Score Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${getScoreColor(percentage)}`}>
                {score}<span className="text-lg text-slate-400">/{total}</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">{percentage}%</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500">
                <ClockIcon className="size-3 inline mr-1" /> Time Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-800">{formatDuration(timeMinutes)}</p>
              {typedTestSet && (
                <p className="mt-1 text-sm text-slate-500">of {formatDuration(typedTestSet.duration_minutes)} allowed</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500">
                <TargetIcon className="size-3 inline mr-1" /> Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-emerald-600 font-medium">{correctCount} ✓</span>
                <span className="text-red-500 font-medium">{incorrectCount} ✗</span>
                <span className="text-slate-400">{skippedCount} —</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex items-center gap-3">
          <Link href={`/tests/${testSetId}/take`}>
            <Button variant="outline">
              <RotateCcwIcon className="size-4 mr-1" />
              Take Again
            </Button>
          </Link>
          <Link href="/account">
            <Button variant="ghost" className="text-slate-500">
              <ArrowLeftIcon className="size-4 mr-1" />
              Back to Account
            </Button>
          </Link>
        </div>

        {/* Question Review */}
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Question Review</h2>
        <div className="space-y-4">
          {typedQuestions.map((q) => {
            const answer = answerMap.get(q.id)
            const isCorrect = answer?.is_correct === true
            const isIncorrect = answer?.selected_option && answer?.is_correct === false
            const isSkipped = !answer?.selected_option

            const optionLabels: Record<string, string> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }

            return (
              <Card
                key={q.id}
                className={`border ${
                  isCorrect ? "border-l-4 border-l-emerald-500" : isIncorrect ? "border-l-4 border-l-red-500" : "border-l-4 border-l-slate-300"
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-slate-500">Q{q.question_number}</span>
                        {isCorrect && <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircleIcon className="size-3.5" /> Correct</span>}
                        {isIncorrect && <span className="flex items-center gap-1 text-xs font-medium text-red-500"><XCircleIcon className="size-3.5" /> Incorrect</span>}
                        {isSkipped && <span className="text-xs text-slate-400">Skipped</span>}
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed mb-3">{q.question_text}</p>

                      {isIncorrect && (
                        <div className="mb-3 rounded-lg bg-red-50 p-3">
                          <p className="text-xs text-slate-500 mb-1">Your answer:</p>
                          <p className="text-sm text-red-600 font-medium">
                            {answer!.selected_option}) {optionLabels[answer!.selected_option!]}
                          </p>
                        </div>
                      )}

                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs text-slate-500 mb-1">Correct answer:</p>
                        <p className="text-sm text-emerald-700 font-medium">
                          {q.correct_option}) {optionLabels[q.correct_option]}
                        </p>
                      </div>

                      {q.solution_text && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-slate-500 mb-1">Solution:</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{q.solution_text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
