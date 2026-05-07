"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { TestTable } from "./test-table"

export async function createTestSet(formData: FormData) {
  const supabase = await createAdminClient()
  const data = {
    subject_id: parseInt(formData.get("subject_id") as string),
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    duration_minutes: parseInt(formData.get("duration_minutes") as string) || 60,
    price_cents: Math.round(parseFloat(formData.get("price_cents") as string) * 100) || 0,
    is_published: formData.get("is_published") === "on",
    question_count: 0,
  }
  await supabase.from("test_sets").insert(data)
  revalidatePath("/admin/tests")
}

export async function updateTestSet(formData: FormData) {
  const supabase = await createAdminClient()
  const id = parseInt(formData.get("id") as string)
  const data = {
    subject_id: parseInt(formData.get("subject_id") as string),
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    duration_minutes: parseInt(formData.get("duration_minutes") as string) || 60,
    price_cents: Math.round(parseFloat(formData.get("price_cents") as string) * 100) || 0,
    is_published: formData.get("is_published") === "on",
  }
  await supabase.from("test_sets").update(data).eq("id", id)
  revalidatePath("/admin/tests")
}

export async function deleteTestSet(formData: FormData) {
  const supabase = await createAdminClient()
  const id = parseInt(formData.get("id") as string)
  await supabase.from("test_sets").delete().eq("id", id)
  revalidatePath("/admin/tests")
}

export async function togglePublished(formData: FormData) {
  const supabase = await createAdminClient()
  const id = parseInt(formData.get("id") as string)
  const is_published = formData.get("is_published") === "true"
  await supabase.from("test_sets").update({ is_published }).eq("id", id)
  revalidatePath("/admin/tests")
}

export default async function AdminTestsPage() {
  const supabase = await createAdminClient()
  const [{ data: tests }, { data: subjects }] = await Promise.all([
    supabase.from("test_sets").select("*, subjects(id, name, level)").order("created_at", { ascending: false }),
    supabase.from("subjects").select("*").order("sort_order", { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage test sets and their questions.
          </p>
        </div>
      </div>

      <TestTable tests={tests ?? []} subjects={subjects ?? []} />
    </div>
  )
}
