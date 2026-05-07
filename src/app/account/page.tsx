import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/utils"
import {
  BookOpenIcon,
  TrophyIcon,
  PlayIcon,
  EyeIcon,
  ShoppingBagIcon,
} from "lucide-react"
import type { Purchase, TestAttempt, TestSet, Subject } from "@/types"

interface PurchaseWithTest extends Purchase {
  test_set: TestSet & { subject: Subject | null }
}

interface AttemptWithTest extends TestAttempt {
  test_set: TestSet & { subject: Subject | null }
}

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin"

  const { data: purchases } = await supabase
    .from("purchases")
    .select(
      "*, test_set:test_sets(*, subject:subjects(*))"
    )
    .eq("user_id", user.id)
    .order("purchased_at", { ascending: false })

  const { data: attempts } = await supabase
    .from("test_attempts")
    .select(
      "*, test_set:test_sets(*, subject:subjects(*))"
    )
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })

  const typedPurchases = (purchases ?? []) as unknown as PurchaseWithTest[]
  const typedAttempts = (attempts ?? []) as unknown as AttemptWithTest[]

  const attemptedTestSetIds = new Set(
    typedAttempts.map((a) => a.test_set_id)
  )

  const purchasedTests = typedPurchases.filter(
    (p) => !attemptedTestSetIds.has(p.test_set_id) && p.test_set?.is_published
  )

  const purchasedIds = new Set(typedPurchases.map((p) => p.test_set_id))
  const attemptsForPurchased = isAdmin
    ? typedAttempts
    : typedAttempts.filter((a) => purchasedIds.has(a.test_set_id))

  const groupedBySubject = new Map<number, {
    subject: Subject
    attempts: AttemptWithTest[]
  }>()

  for (const a of attemptsForPurchased) {
    const subj = a.test_set?.subject
    if (subj) {
      if (!groupedBySubject.has(subj.id)) {
        groupedBySubject.set(subj.id, { subject: subj, attempts: [] })
      }
      groupedBySubject.get(subj.id)!.attempts.push(a)
    }
  }

  const attemptStatus = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge>Completed</Badge>
      case "timed_out":
        return <Badge variant="secondary">Timed Out</Badge>
      case "in_progress":
        return <Badge variant="outline">In Progress</Badge>
      default:
        return null
    }
  }

  const isEmpty =
    typedPurchases.length === 0 && typedAttempts.length === 0 && !isAdmin

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0f172a]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Account</h1>
          <p className="mt-1 text-sm text-slate-400">
            {user.email}
          </p>
        </div>

        {isEmpty && (
          <Card className="bg-[#1e293b] border-white/10 py-12">
            <CardContent className="flex flex-col items-center gap-3">
              <ShoppingBagIcon className="size-10 text-slate-500" />
              <p className="text-slate-400">
                You haven&apos;t purchased any tests yet.
              </p>
              <Link href="/">
                <Button className="bg-amber-400 font-medium text-[#1e293b] hover:bg-amber-300">
                  Browse Tests
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {purchasedTests.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <BookOpenIcon className="size-5 text-amber-400" />
              Ready to Start
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {purchasedTests.map((p) => (
                <Card
                  key={p.id}
                  className="bg-[#1e293b] border-white/10 hover:border-amber-400/30 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white">
                          {p.test_set?.name ?? "Untitled Test"}
                        </CardTitle>
                        {p.test_set?.subject?.name && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {p.test_set.subject.name}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {formatDuration(p.test_set?.duration_minutes ?? 0)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                      {p.test_set?.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Purchased {new Date(p.purchased_at).toLocaleDateString()}
                      </span>
                      <Link href={`/tests/${p.test_set_id}/take`}>
                        <Button className="bg-amber-400 font-medium text-[#1e293b] hover:bg-amber-300 text-xs">
                          <PlayIcon className="size-3.5" />
                          Start Test
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {groupedBySubject.size > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <TrophyIcon className="size-5 text-amber-400" />
              Past Attempts
            </h2>

            <div className="space-y-8">
              {Array.from(groupedBySubject.entries()).map(
                ([subjectId, { subject, attempts: subjectAttempts }]) => (
                  <div key={subjectId}>
                    <h3 className="mb-3 text-sm font-semibold text-slate-300">
                      {subject.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        ({subject.level} Year {subject.grade})
                      </span>
                    </h3>

                    <div className="space-y-3">
                      {subjectAttempts.map((a) => {
                        const startedAt = new Date(a.started_at)
                        const completedAt = a.completed_at
                          ? new Date(a.completed_at)
                          : null
                        const timeMs = completedAt
                          ? completedAt.getTime() - startedAt.getTime()
                          : 0
                        const timeMin = Math.round(timeMs / 60000)
                        const percentage =
                          a.total_questions > 0 && a.score != null
                            ? Math.round((a.score / a.total_questions) * 100)
                            : null

                        return (
                          <Card
                            key={a.id}
                            className="bg-[#1e293b] border-white/10"
                          >
                            <CardContent className="flex items-center justify-between py-4">
                              <div className="flex items-center gap-4">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5">
                                  <TrophyIcon className="size-5 text-amber-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {a.test_set?.name ?? "Test"}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {startedAt.toLocaleDateString()} &middot;{" "}
                                    {formatDuration(timeMin)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {percentage !== null && (
                                  <span
                                    className={`text-sm font-semibold ${
                                      percentage >= 70
                                        ? "text-emerald-400"
                                        : percentage >= 40
                                          ? "text-amber-400"
                                          : "text-red-400"
                                    }`}
                                  >
                                    {a.score}/{a.total_questions} ({percentage}%)
                                  </span>
                                )}
                                {attemptStatus(a.status)}
                                <Link
                                  href={`/tests/${a.test_set_id}/results/${a.id}`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    className="text-slate-400 hover:text-white hover:bg-white/10"
                                  >
                                    <EyeIcon className="size-3.5" />
                                    Review
                                  </Button>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {typedPurchases.length > 0 &&
          purchasedTests.length === 0 &&
          groupedBySubject.size === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400">No active tests to display.</p>
            </div>
          )}
      </div>
    </div>
  )
}
