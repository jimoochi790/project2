import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubjectIcon } from "@/components/subject-icon"
import { GraduationCap, School, BookOpen } from "lucide-react"
import type { Subject } from "@/types"

export default async function SubjectsPage() {
  const supabase = await createClient()
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("sort_order")
    .returns<Subject[]>()

  const ocSubjects = (subjects ?? []).filter((s) => s.level === "OC")
  const selectiveSubjects = (subjects ?? []).filter((s) => s.level === "Selective")

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose Your Subject</h1>
        <p className="mt-3 text-muted-foreground text-lg">
          Select a subject area to explore available practice tests
        </p>
      </div>

      {/* OC Section */}
      <section id="oc" className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">OC Preparation</h2>
            <p className="text-sm text-muted-foreground">Grade 4 — Opportunity Class Entry</p>
          </div>
        </div>
        {ocSubjects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ocSubjects.map((subject) => (
              <Link key={subject.id} href={`/subjects/${subject.slug}`} className="group">
                <Card className="h-full transition-all group-hover:shadow-md group-hover:ring-1 group-hover:ring-blue-400/30">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                        <SubjectIcon slug={subject.slug} className="size-6" />
                      </div>
                      <Badge variant="outline">Year 4</Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{subject.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border border-dashed">
            <BookOpen className="size-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">OC subjects coming soon.</p>
          </div>
        )}
      </section>

      {/* Selective Section */}
      <section id="selective">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <School className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Selective School Preparation</h2>
            <p className="text-sm text-muted-foreground">Grade 6 — Selective High School Entry</p>
          </div>
        </div>
        {selectiveSubjects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {selectiveSubjects.map((subject) => (
              <Link key={subject.id} href={`/subjects/${subject.slug}`} className="group">
                <Card className="h-full transition-all group-hover:shadow-md group-hover:ring-1 group-hover:ring-amber-400/30">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                        <SubjectIcon slug={subject.slug} className="size-6" />
                      </div>
                      <Badge variant="outline">Year 6</Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{subject.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border border-dashed">
            <BookOpen className="size-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Selective subjects coming soon.</p>
          </div>
        )}
      </section>
    </div>
  )
}
