import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatPrice, formatDuration } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, FileText, RotateCcw, HelpCircle, DollarSign, GraduationCap } from "lucide-react"
import type { TestSet } from "@/types"

interface Props {
  params: Promise<{ id: string }>
}

export default async function TestDetailPage({ params }: Props) {
  const { id } = await params
  const testSetId = Number(id)
  if (Number.isNaN(testSetId)) {
    notFound()
  }

  const supabase = await createClient()

  const { data: testSet } = await supabase
    .from("test_sets")
    .select("*, subject:subjects(*)")
    .eq("id", testSetId)
    .single<TestSet & { subject: { id: number; name: string; description: string; slug: string; level: string; grade: number; sort_order: number; created_at: string } }>()

  if (!testSet) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let hasPurchased = false
  if (user) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("test_set_id", testSetId)
      .maybeSingle()

    hasPurchased = !!purchase
  }

  const whatsIncluded = [
    {
      icon: Clock,
      title: "Timed Test",
      description: `${formatDuration(testSet.duration_minutes)} exam with countdown timer to simulate real test conditions`,
    },
    {
      icon: CheckCircle2,
      title: "Instant Results",
      description: "Get your score and performance breakdown as soon as you finish",
    },
    {
      icon: FileText,
      title: "Detailed Solutions",
      description: "Step-by-step explanations for every question to learn from mistakes",
    },
    {
      icon: RotateCcw,
      title: "Review Anytime",
      description: "Access your completed tests and review answers whenever you want",
    },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <Link
        href={`/subjects/${testSet.subject.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        &larr; {testSet.subject.name}
      </Link>

      <div className="flex items-start gap-4 mb-10">
        <div className="flex size-14 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400 shrink-0">
          <GraduationCap className="size-7" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{testSet.name}</h1>
            <Badge variant="secondary">
              {testSet.subject.level === "OC" ? "Year 4" : "Year 6"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">{testSet.subject.name}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="size-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-semibold">{formatDuration(testSet.duration_minutes)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <HelpCircle className="size-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Questions</p>
              <p className="font-semibold">{testSet.question_count}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="size-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-semibold">{formatPrice(testSet.price_cents)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <p className="text-muted-foreground leading-relaxed mb-10">{testSet.description}</p>

      {/* What's Included */}
      <h2 className="text-2xl font-bold mb-6">What&apos;s included</h2>
      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        {whatsIncluded.map((item) => (
          <Card key={item.title}>
            <CardContent className="flex gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-400 shrink-0">
                <item.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-0.5">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        {user && hasPurchased ? (
          <Link
            href={`/tests/${testSet.id}/take`}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-8 py-3 text-base font-semibold text-[#1e293b] hover:bg-amber-300 transition-colors"
          >
            Start Test
          </Link>
        ) : user && !hasPurchased ? (
          <Link
            href={`/api/stripe/checkout?testSetId=${testSet.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-8 py-3 text-base font-semibold text-[#1e293b] hover:bg-amber-300 transition-colors"
          >
            Purchase &mdash; {formatPrice(testSet.price_cents)}
          </Link>
        ) : (
          <Link
            href={`/login?redirect=/tests/${testSet.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-8 py-3 text-base font-semibold text-[#1e293b] hover:bg-amber-300 transition-colors"
          >
            Login to Purchase
          </Link>
        )}
      </div>
    </div>
  )
}
