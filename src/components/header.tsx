"use client";

import { useEffect, useState } from "react";
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
import { MenuIcon, LogOutIcon, UserIcon, BookOpenIcon, ShieldIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { href: "/subjects", label: "Subjects", icon: BookOpenIcon },
    { href: "/account", label: "Account", icon: UserIcon },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-[#1e293b] text-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg tracking-tight text-amber-400"
        >
          <BookOpenIcon className="size-5" />
          TestPrep
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-white/15 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>

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
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSheetOpen(false)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-accent/10 text-accent-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <link.icon className="size-4" />
                    {link.label}
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
                      My Tests
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
