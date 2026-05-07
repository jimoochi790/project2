import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatPrice, formatDuration } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubjectIcon } from "@/components/subject-icon"
import { Clock, DollarSign, HelpCircle, BookOpen } from "lucide-react"
import type { Subject, TestSet } from "@/types"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function SubjectPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .single<Subject>()

  if (!subject) {
    notFound()
  }

  const { data: testSets } = await supabase
    .from("test_sets")
    .select("*")
    .eq("subject_id", subject.id)
    .order("created_at", { ascending: false })
    .returns<TestSet[]>()

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      {/* Subject Header */}
      <div className="mb-12">
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          &larr; All Subjects
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400 shrink-0">
            <SubjectIcon slug={subject.slug} className="size-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{subject.name}</h1>
              <Badge variant="secondary">
                {subject.level === "OC" ? "Year 4" : "Year 6"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">{subject.description}</p>
          </div>
        </div>
      </div>

      {/* Test Sets Grid */}
      <h2 className="text-2xl font-bold mb-6">Available Tests</h2>
      {testSets && testSets.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testSets.map((testSet) => (
            <Link
              key={testSet.id}
              href={testSet.is_published ? `/tests/${testSet.id}` : "#"}
              className={testSet.is_published ? "group" : "pointer-events-none"}
            >
              <Card className="h-full transition-all group-hover:shadow-md group-hover:ring-1 group-hover:ring-amber-400/30">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-lg">{testSet.name}</h3>
                    {testSet.is_published ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Coming soon</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-1">
                    {testSet.description}
                  </p>
                  <div className="flex items-center divide-x divide-border text-sm text-muted-foreground pt-4 border-t">
                    <div className="flex items-center gap-1.5 pr-4">
                      <Clock className="size-4" />
                      {formatDuration(testSet.duration_minutes)}
                    </div>
                    <div className="flex items-center gap-1.5 px-4">
                      <HelpCircle className="size-4" />
                      {testSet.question_count} questions
                    </div>
                    <div className="flex items-center gap-1.5 pl-4 font-semibold text-foreground">
                      <DollarSign className="size-4" />
                      {formatPrice(testSet.price_cents)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-dashed">
          <BookOpen className="size-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground text-lg">No tests available yet for this subject.</p>
          <p className="text-sm text-muted-foreground mt-1">Check back soon for new practice exams.</p>
        </div>
      )}
    </div>
  )
}
