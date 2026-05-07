"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { SubjectTable } from "./subject-table"

export async function createSubject(formData: FormData) {
  const supabase = await createAdminClient()
  const data = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    slug: formData.get("slug") as string,
    level: formData.get("level") as "OC" | "Selective",
    grade: parseInt(formData.get("grade") as string) || 0,
    sort_order: parseInt(formData.get("sort_order") as string) || 0,
  }
  await supabase.from("subjects").insert(data)
  revalidatePath("/admin/subjects")
}

export async function updateSubject(formData: FormData) {
  const supabase = await createAdminClient()
  const id = parseInt(formData.get("id") as string)
  const data = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    slug: formData.get("slug") as string,
    level: formData.get("level") as "OC" | "Selective",
    grade: parseInt(formData.get("grade") as string) || 0,
    sort_order: parseInt(formData.get("sort_order") as string) || 0,
  }
  await supabase.from("subjects").update(data).eq("id", id)
  revalidatePath("/admin/subjects")
}

export async function deleteSubject(formData: FormData) {
  const supabase = await createAdminClient()
  const id = parseInt(formData.get("id") as string)
  await supabase.from("subjects").delete().eq("id", id)
  revalidatePath("/admin/subjects")
}

export default async function AdminSubjectsPage() {
  const supabase = await createAdminClient()
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage test subjects for OC and Selective exams.
          </p>
        </div>
      </div>

      <SubjectTable subjects={subjects ?? []} />
    </div>
  )
}
