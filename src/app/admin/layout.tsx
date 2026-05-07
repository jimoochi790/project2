import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  FileTextIcon,
  ArrowLeftIcon,
  ShieldIcon,
} from "lucide-react"
import { AdminNav } from "./admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="sticky top-14 w-56 shrink-0 border-r bg-muted/30 flex flex-col">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 text-sm font-semibold text-muted-foreground">
          <ShieldIcon className="size-4" />
          Admin Panel
        </div>
        <AdminNav />
        <div className="mt-auto p-3 border-t">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Back to site
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
