import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubjectIcon } from "@/components/subject-icon"
import { ArrowRight, BookOpen, Clock, Trophy, FileText, GraduationCap, School } from "lucide-react"
import type { Subject } from "@/types"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("sort_order")
    .returns<Subject[]>()

  const features = [
    {
      icon: BookOpen,
      title: "6 Subjects",
      description: "Reading, Math Reasoning & Thinking Skills for OC and Selective",
    },
    {
      icon: Clock,
      title: "Timed Tests",
      description: "Real exam conditions with countdown timers",
    },
    {
      icon: Trophy,
      title: "Instant Results",
      description: "Get your score and detailed feedback immediately",
    },
    {
      icon: FileText,
      title: "Detailed Solutions",
      description: "Step-by-step explanations for every question",
    },
  ]

  const comparisonCards = [
    {
      icon: GraduationCap,
      title: "Opportunity Class (OC)",
      grade: "Grade 4",
      description: "Entry into Year 5 opportunity classes at select NSW primary schools. Tests reading, math reasoning, and thinking skills.",
      href: "/subjects#oc",
      color: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
    },
    {
      icon: School,
      title: "Selective School",
      grade: "Grade 6",
      description: "Entry into Year 7 selective high schools across NSW. More advanced content across the same three subject areas.",
      href: "/subjects#selective",
      color: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
    },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1e293b] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] via-[#1e293b] to-slate-800" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32">
          <div className="flex flex-col items-center text-center gap-6">
            <Badge variant="secondary" className="bg-amber-400/20 text-amber-400 border-amber-400/30 text-sm px-3 py-1">
              NSW Opportunity Class & Selective School Test Prep
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Prepare for OC & Selective School Tests
            </h1>
            <p className="max-w-2xl text-lg text-slate-300 leading-relaxed">
              Practice with realistic online exams designed for NSW Opportunity Class and Selective School entry.
              Timed tests, instant results, and detailed solutions to help your child succeed.
            </p>
            <div className="flex gap-4 pt-4">
              <Link
                href="/subjects"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-base font-semibold text-[#1e293b] hover:bg-amber-300 transition-colors"
              >
                Get Started
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="/subjects"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                View Subjects
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to prepare
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Comprehensive practice platform built for OC and Selective test success
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col items-center text-center p-6">
              <div className="flex size-12 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-400 mb-4">
                <feature.icon className="size-6" />
              </div>
              <CardHeader className="p-0">
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="mt-2">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* OC vs Selective Comparison */}
      <section className="bg-muted/50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              OC or Selective? We&apos;ve got both covered
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Tailored practice for each exam level
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {comparisonCards.map((card) => (
              <Link key={card.title} href={card.href} className="group">
                <Card className={`h-full border-2 transition-all group-hover:shadow-lg ${card.color}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-background/80">
                        <card.icon className="size-5 text-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{card.title}</h3>
                        <Badge variant="outline" className="mt-0.5">{card.grade}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Preview */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Explore our subjects
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            All 6 subjects with full practice tests
          </p>
        </div>
        {subjects && subjects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link key={subject.id} href={`/subjects/${subject.slug}`} className="group">
                <Card className="h-full transition-all group-hover:shadow-md group-hover:ring-1 group-hover:ring-amber-400/30">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-400">
                        <SubjectIcon slug={subject.slug} className="size-6" />
                      </div>
                      <Badge variant="outline">{subject.level}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{subject.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="size-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Subjects coming soon. Check back later!</p>
          </div>
        )}
      </section>
    </div>
  )
}
