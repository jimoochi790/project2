import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/utils"
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon, RotateCcwIcon } from "lucide-react"
import type { TestAttempt, TestSet, Question, AttemptAnswer } from "@/types"

interface Props {
  params: Promise<{ id: string; attemptId: string }>
}

export default async function ResultsPage({ params }: Props) {
  const { id, attemptId } = await params
  const testSetId = Number(id)
  const attemptIdNum = Number(attemptId)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
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
  for (const a of typedAnswers) {
    answerMap.set(a.question_id, a)
  }

  const score = typedAttempt.score ?? 0
  const total = typedAttempt.total_questions
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  const startedAt = new Date(typedAttempt.started_at)
  const completedAt = typedAttempt.completed_at
    ? new Date(typedAttempt.completed_at)
    : new Date()
  const timeMs = completedAt.getTime() - startedAt.getTime()
  const timeMinutes = Math.round(timeMs / 60000)

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "timed_out":
        return <Badge variant="secondary">Timed Out</Badge>
      case "in_progress":
        return <Badge variant="outline">In Progress</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0f172a]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {typedTestSet?.name ?? "Test"} — Results
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {typedTestSet?.description}
            </p>
          </div>
          {statusBadge(typedAttempt.status)}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="bg-[#1e293b] border-white/10">
            <CardHeader>
              <CardTitle className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {score}
                <span className="text-lg text-slate-400">/{total}</span>
              </p>
              <p className="mt-1 text-sm text-slate-400">{percentage}%</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b] border-white/10">
            <CardHeader>
              <CardTitle className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                Time Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {formatDuration(timeMinutes)}
              </p>
              {typedTestSet && (
                <p className="mt-1 text-sm text-slate-400">
                  of {formatDuration(typedTestSet.duration_minutes)} allowed
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b] border-white/10">
            <CardHeader>
              <CardTitle className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium text-white">
                {completedAt.toLocaleDateString()}
              </p>
              <p className="text-sm text-slate-400">
                {completedAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 flex items-center gap-3">
          <Link href={`/tests/${testSetId}/take`}>
            <Button className="bg-amber-400 font-medium text-[#1e293b] hover:bg-amber-300">
              <RotateCcwIcon className="size-4" />
              Review Again
            </Button>
          </Link>
          <Link href="/account">
            <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/10">
              <ArrowLeftIcon className="size-4" />
              Back to Account
            </Button>
          </Link>
        </div>

        <h2 className="mb-4 text-lg font-semibold text-white">
          Question Review
        </h2>

        <div className="space-y-4">
          {typedQuestions.map((q) => {
            const answer = answerMap.get(q.id)
            const isCorrect = answer?.is_correct === true
            const isIncorrect = answer?.selected_option && answer?.is_correct === false
            const isSkipped = !answer?.selected_option

            const optionLabels: Record<string, string> = {
              A: q.option_a,
              B: q.option_b,
              C: q.option_c,
              D: q.option_d,
            }

            return (
              <Card
                key={q.id}
                className={`bg-[#1e293b] border-white/10 ${
                  isCorrect
                    ? "border-l-4 border-l-emerald-500"
                    : isIncorrect
                      ? "border-l-4 border-l-red-500"
                      : "border-l-4 border-l-slate-500"
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-slate-400">
                          Q{q.question_number}
                        </span>
                        {isCorrect && (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                            <CheckCircleIcon className="size-3.5" /> Correct
                          </span>
                        )}
                        {isIncorrect && (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-400">
                            <XCircleIcon className="size-3.5" /> Incorrect
                          </span>
                        )}
                        {isSkipped && (
                          <span className="text-xs font-medium text-slate-500">
                            Skipped
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-white leading-relaxed mb-3">
                        {q.question_text}
                      </p>

                      {isIncorrect && (
                        <div className="mb-3 rounded-lg bg-white/5 p-3">
                          <p className="text-xs text-slate-400 mb-1">
                            Your answer:
                          </p>
                          <p className="text-sm text-red-400">
                            {answer.selected_option}){" "}
                            {optionLabels[answer.selected_option!]}
                          </p>
                        </div>
                      )}

                      <div className="rounded-lg bg-emerald-500/10 p-3">
                        <p className="text-xs text-slate-400 mb-1">
                          Correct answer:
                        </p>
                        <p className="text-sm text-emerald-400">
                          {q.correct_option}){" "}
                          {optionLabels[q.correct_option]}
                        </p>
                      </div>

                      {q.solution_text && (
                        <div className="mt-3 rounded-lg bg-white/5 p-3">
                          <p className="text-xs text-slate-400 mb-1">
                            Solution:
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {q.solution_text}
                          </p>
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
