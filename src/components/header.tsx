"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon, LogOutIcon, BookOpenIcon, ShieldIcon, PlayIcon, EyeIcon, ChevronDownIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface PurchasedTest {
  id: number
  test_set_id: number
  name: string
  attempted: boolean
  attempt_id?: number
  score?: number
  total?: number
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [purchasedTests, setPurchasedTests] = useState<PurchasedTest[]>([]);
  const [testsOpen, setTestsOpen] = useState(false);

  const fetchTests = useCallback(async (userId: string) => {
    const supabase = createClient()
    const { data: profile } = await supabase
      .from("users").select("role").eq("id", userId).maybeSingle()
    const isAdmin = profile?.role === "admin"

    if (isAdmin) {
      const { data: sets } = await supabase
        .from("test_sets")
        .select("id, name")
        .eq("is_published", true)
        .order("id")
      const tests: PurchasedTest[] = (sets ?? []).map(s => ({
        id: 0, test_set_id: s.id, name: s.name, attempted: false,
      }))
      setPurchasedTests(tests)
      return
    }

    const [{ data: purchases }, { data: attempts }] = await Promise.all([
      supabase.from("purchases").select("*, test_set:test_sets(name)")
        .eq("user_id", userId),
      supabase.from("test_attempts").select("id, test_set_id, score, total_questions, status")
        .eq("user_id", userId),
    ])

    const attemptsByTest = new Map<number, { id: number; score: number; total: number }>()
    for (const a of (attempts ?? [])) {
      if (a.status === "completed" && a.score != null) {
        attemptsByTest.set(a.test_set_id, { id: a.id, score: a.score, total: a.total_questions as number })
      }
    }

    const tests: PurchasedTest[] = []
    for (const p of (purchases ?? [])) {
      const ts = (p as any).test_set as { name: string }
      const attempt = attemptsByTest.get(p.test_set_id)
      tests.push({
        id: p.id,
        test_set_id: p.test_set_id,
        name: ts?.name ?? "Untitled",
        attempted: !!attempt,
        attempt_id: attempt?.id,
        score: attempt?.score,
        total: attempt?.total,
      })
    }
    setPurchasedTests(tests)
  }, [])

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchTests(data.user.id)
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchTests(session.user.id)
      else setPurchasedTests([])
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchTests]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-[#1e293b] text-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight text-amber-400 shrink-0"
          >
            <BookOpenIcon className="size-5" />
            TestPrep
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/subjects"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive("/subjects")
                  ? "bg-white/15 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <BookOpenIcon className="size-4" />
              Subjects
            </Link>

            {user && purchasedTests.length > 0 && (
              <DropdownMenu open={testsOpen} onOpenChange={setTestsOpen}>
                <DropdownMenuTrigger
                  render={
                    <button
                      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        testsOpen
                          ? "bg-white/15 text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      My Tests
                      <ChevronDownIcon className={`size-3.5 transition-transform ${testsOpen ? "rotate-180" : ""}`} />
                    </button>
                  }
                />
                <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-auto">
                  {purchasedTests.map((test) => (
                    <DropdownMenuItem
                      key={`${test.test_set_id}-${test.attempt_id ?? "new"}`}
                      onClick={() => {
                        setTestsOpen(false)
                        if (test.attempted && test.attempt_id) {
                          router.push(`/tests/${test.test_set_id}/results/${test.attempt_id}`)
                        } else {
                          router.push(`/tests/${test.test_set_id}/take`)
                        }
                      }}
                      className="cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{test.name}</p>
                        {test.attempted && test.score != null && (
                          <p className="text-xs text-slate-400">
                            Score: {test.score}/{test.total} ({Math.round(test.score / (test.total || 1) * 100)}%)
                          </p>
                        )}
                      </div>
                      {test.attempted ? (
                        <EyeIcon className="size-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <PlayIcon className="size-3.5 text-amber-400 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { setTestsOpen(false); router.push("/account") }}
                    className="cursor-pointer text-xs text-slate-400"
                  >
                    View all &rarr;
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="size-8 rounded-full bg-white/10 animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-amber-400 text-[#1e293b] font-medium text-xs">
                        {user.email?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/account")}
                  className="cursor-pointer"
                >
                  <BookOpenIcon className="size-4" />
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/admin")}
                  className="cursor-pointer"
                >
                  <ShieldIcon className="size-4" />
                  Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <LogOutIcon className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              className="bg-amber-400 text-[#1e293b] hover:bg-amber-300 font-medium"
            >
              Login
            </Button>
          )}

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                  <MenuIcon className="size-5" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-64 pt-12">
              <nav className="flex flex-col gap-1">
                <Link
                  href="/subjects"
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive("/subjects")
                      ? "bg-accent/10 text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <BookOpenIcon className="size-4" />
                  Subjects
                </Link>
                {user && <div className="my-2 border-t" />}
                {user && purchasedTests.map((test) => (
                  <Link
                    key={`${test.test_set_id}-${test.attempt_id ?? "new"}`}
                    href={test.attempted && test.attempt_id
                      ? `/tests/${test.test_set_id}/results/${test.attempt_id}`
                      : `/tests/${test.test_set_id}/take`}
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <span className="truncate flex-1">{test.name}</span>
                    {test.attempted ? (
                      <span className="text-xs text-slate-400 ml-2 shrink-0">
                        {test.score}/{test.total}
                      </span>
                    ) : (
                      <PlayIcon className="size-3 text-amber-400 ml-2 shrink-0" />
                    )}
                  </Link>
                ))}
                {user && (
                  <>
                    <div className="my-2 border-t" />
                    <Link
                      href="/account"
                      onClick={() => setSheetOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <BookOpenIcon className="size-4" />
                      My Account
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setSheetOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <ShieldIcon className="size-4" />
                      Admin
                    </Link>
                    <button
                      onClick={() => {
                        setSheetOpen(false);
                        handleSignOut();
                      }}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      <LogOutIcon className="size-4" />
                      Sign out
                    </button>
                  </>
                )}
                {!user && !loading && (
                  <>
                    <div className="my-2 border-t" />
                    <Button
                      onClick={() => {
                        setSheetOpen(false);
                        router.push("/login");
                      }}
                      className="bg-amber-400 text-[#1e293b] hover:bg-amber-300 font-medium"
                    >
                      Login
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}