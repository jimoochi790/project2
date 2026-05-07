"use server"

import { revalidatePath } from "next/cache"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuestionTable } from "./question-table"
import { ArrowLeftIcon } from "lucide-react"

export async function createQuestion(formData: FormData) {
  const supabase = await createAdminClient()
  const test_set_id = parseInt(formData.get("test_set_id") as string)

  const { data: maxQ } = await supabase
    .from("questions")
    .select("sort_order")
    .eq("test_set_id", test_set_id)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextOrder = maxQ && maxQ.length > 0 ? (maxQ[0].sort_order ?? 0) + 1 : 1

  const data = {
    test_set_id,
    question_number: parseInt(formData.get("question_number") as string),
    question_text: formData.get("question_text") as string,
    option_a: formData.get("option_a") as string,
    option_b: formData.get("option_b") as string,
    option_c: formData.get("option_c") as string,
    option_d: formData.get("option_d") as string,
    correct_option: formData.get("correct_option") as "A" | "B" | "C" | "D",
    solution_text: formData.get("solution_text") as string,
    sort_order: nextOrder,
  }
  await supabase.from("questions").insert(data)

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("test_set_id", test_set_id)
  await supabase
    .from("test_sets")
    .update({ question_count: count ?? 0 })
    .eq("id", test_set_id)

  revalidatePath(`/admin/tests/${test_set_id}/questions`)
}

export async function updateQuestion(formData: FormData) {
  const supabase = await createAdminClient()
  const id = parseInt(formData.get("id") as string)
  const test_set_id = parseInt(formData.get("test_set_id") as string)

  const data = {
    question_number: parseInt(formData.get("question_number") as string),
    question_text: formData.get("question_text") as string,
    option_a: formData.get("option_a") as string,
    option_b: formData.get("option_b") as string,
    option_c: formData.get("option_c") as string,
    option_d: formData.get("option_d") as string,
    correct_option: formData.get("correct_option") as "A" | "B" | "C" | "D",
    solution_text: formData.get("solution_text") as string,
  }
  await supabase.from("questions").update(data).eq("id", id)

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("test_set_id", test_set_id)
  await supabase
    .from("test_sets")
    .update({ question_count: count ?? 0 })
    .eq("id", test_set_id)

  revalidatePath(`/admin/tests/${test_set_id}/questions`)
}

export async function deleteQuestion(formData: FormData) {
  const supabase = await createAdminClient()
  const id = parseInt(formData.get("id") as string)
  const test_set_id = parseInt(formData.get("test_set_id") as string)

  await supabase.from("questions").delete().eq("id", id)

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("test_set_id", test_set_id)
  await supabase
    .from("test_sets")
    .update({ question_count: count ?? 0 })
    .eq("id", test_set_id)

  revalidatePath(`/admin/tests/${test_set_id}/questions`)
}

export async function moveQuestionUp(formData: FormData) {
  const supabase = await createAdminClient()
  const id = parseInt(formData.get("id") as string)
  const test_set_id = parseInt(formData.get("test_set_id") as string)

  const { data: current } = await supabase
    .from("questions")
    .select("sort_order")
    .eq("id", id)
    .single()

  if (!current) return

  const { data: prev } = await supabase
    .from("questions")
    .select("id, sort_order")
    .eq("test_set_id", test_set_id)
    .lt("sort_order", current.sort_order)
    .order("sort_order", { ascending: false })
    .limit(1)

  if (prev && prev.length > 0) {
    await supabase.from("questions").update({ sort_order: prev[0].sort_order }).eq("id", id)
    await supabase.from("questions").update({ sort_order: current.sort_order }).eq("id", prev[0].id)
  }

  revalidatePath(`/admin/tests/${test_set_id}/questions`)
}

export async function moveQuestionDown(formData: FormData) {
  const supabase = await createAdminClient()
  const id = parseInt(formData.get("id") as string)
  const test_set_id = parseInt(formData.get("test_set_id") as string)

  const { data: current } = await supabase
    .from("questions")
    .select("sort_order")
    .eq("id", id)
    .single()

  if (!current) return

  const { data: next } = await supabase
    .from("questions")
    .select("id, sort_order")
    .eq("test_set_id", test_set_id)
    .gt("sort_order", current.sort_order)
    .order("sort_order", { ascending: true })
    .limit(1)

  if (next && next.length > 0) {
    await supabase.from("questions").update({ sort_order: next[0].sort_order }).eq("id", id)
    await supabase.from("questions").update({ sort_order: current.sort_order }).eq("id", next[0].id)
  }

  revalidatePath(`/admin/tests/${test_set_id}/questions`)
}

export default async function AdminTestQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const testSetId = parseInt(id)
  if (isNaN(testSetId)) notFound()

  const supabase = await createAdminClient()
  const { data: testSet } = await supabase
    .from("test_sets")
    .select("*, subjects(id, name, level)")
    .eq("id", testSetId)
    .single()

  if (!testSet) notFound()

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("test_set_id", testSetId)
    .order("sort_order", { ascending: true })

  const subjectName =
    testSet.subjects && typeof testSet.subjects === "object"
      ? (testSet.subjects as { name: string }).name
      : `Subject #${testSet.subject_id}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tests">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeftIcon className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {testSet.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {subjectName}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {questions?.length ?? 0} questions
            </span>
          </div>
        </div>
      </div>

      <QuestionTable
        testSetId={testSetId}
        testSet={testSet}
        questions={questions ?? []}
      />
    </div>
  )
}
