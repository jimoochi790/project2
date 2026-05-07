import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import {
  BookOpenIcon,
  FileTextIcon,
  HelpCircleIcon,
  ShoppingCartIcon,
  ClockIcon,
} from "lucide-react"

export default async function AdminDashboard() {
  const supabase = await createAdminClient()

  const [
    { count: subjectsCount },
    { count: testsCount },
    { count: questionsCount },
    { count: purchasesCount },
    { data: recentPurchases },
  ] = await Promise.all([
    supabase.from("subjects").select("*", { count: "exact", head: true }),
    supabase.from("test_sets").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("purchases").select("*", { count: "exact", head: true }),
    supabase
      .from("purchases")
      .select("id, user_id, test_set_id, amount_cents, purchased_at, test_sets(name)")
      .order("purchased_at", { ascending: false })
      .limit(10),
  ])

  const stats = [
    {
      label: "Subjects",
      value: subjectsCount ?? 0,
      icon: BookOpenIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Test Sets",
      value: testsCount ?? 0,
      icon: FileTextIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      label: "Questions",
      value: questionsCount ?? 0,
      icon: HelpCircleIcon,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Purchases",
      value: purchasesCount ?? 0,
      icon: ShoppingCartIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your test prep platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="size-4" />
            Recent Purchases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPurchases && recentPurchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">
                      Purchase ID
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      Test Set
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.map((p: Record<string, unknown>) => (
                    <tr key={p.id as number} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">
                        #{String(p.id)}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {String(p.user_id).slice(0, 8)}...
                      </td>
                      <td className="py-2 pr-4">
                        {typeof p.test_sets === "object" && p.test_sets !== null
                          ? String((p.test_sets as Record<string, unknown>).name ?? "—")
                          : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {formatPrice(p.amount_cents as number)}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(p.purchased_at as string).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No purchases yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
