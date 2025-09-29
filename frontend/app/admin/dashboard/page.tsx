"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useProtectedRoute } from "../../hooks/useProtectedRoute";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useProtectedRoute({
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    redirectOnFail: "/dashboard",
  });

  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    router.replace("/login");
  }, [router]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
        <p className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm uppercase tracking-[0.4em] text-sky-200">
          Loading admin dashboard...
        </p>
      </main>
    );
  }

  const displayName = user.displayName?.trim() || user.username;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-lg font-semibold">
              DH
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-sky-200">
                DockerHub Clone
              </p>
              <h1 className="text-xl font-semibold">Administrator control center</h1>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden rounded-full bg-white/5 px-4 py-2 text-slate-100 md:inline-flex">
              {displayName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-sky-500 px-4 py-2 font-semibold uppercase tracking-wide text-sm text-white transition hover:bg-sky-400"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-br from-sky-500 via-blue-700 to-slate-900 p-10 shadow-xl">
            <p className="text-sm uppercase tracking-[0.4em] text-sky-100">Welcome back</p>
            <h2 className="mt-6 text-4xl font-semibold leading-tight">
              Keep the platform healthy and the community thriving.
            </h2>
            <p className="mt-6 max-w-xl text-sm text-sky-100/80">
              Review account activity, curate official images, and monitor analytics from one place.
              Use the quick links below to jump into the most common administrative workflows.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-wide">
              <Link
                href="/admin/users"
                className="rounded-full bg-white px-6 py-3 text-slate-900 transition hover:bg-slate-200"
              >
                Manage users
              </Link>
              <Link
                href="/admin/repositories"
                className="rounded-full border border-white/50 px-6 py-3 text-white transition hover:border-white hover:bg-white/10"
              >
                Official repositories
              </Link>
              <Link
                href="/admin/analytics"
                className="rounded-full border border-white/50 px-6 py-3 text-white transition hover:border-white hover:bg-white/10"
              >
                View analytics
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200">User insights</p>
              <h3 className="mt-3 text-xl font-semibold">Account health</h3>
              <p className="mt-3 text-sm text-slate-200/80">
                Monitor registrations, deactivations, and badge assignments to keep trusted publishers highlighted.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Registry</p>
              <h3 className="mt-3 text-xl font-semibold">Official images</h3>
              <p className="mt-3 text-sm text-slate-200/80">
                Create and curate Docker Official Images to ensure developers can rely on secure, well-maintained bases.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Quick navigation</p>
            <ul className="mt-6 space-y-4 text-sm text-slate-100/90">
              <li>
                <Link
                  href="/admin/users"
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
                >
                  User management
                  <span aria-hidden className="text-lg">→</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/repositories"
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
                >
                  Official repositories
                  <span aria-hidden className="text-lg">→</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/explore"
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
                >
                  Explore community
                  <span aria-hidden className="text-lg">↗</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Latest signals</p>
            <ul className="mt-6 space-y-4 text-sm text-slate-100/80">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div>
                  <p className="font-medium text-slate-50">Two new publishers completed verification today.</p>
                  <p className="text-xs text-slate-400">moments ago</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-400" />
                <div>
                  <p className="font-medium text-slate-50">Official base image refresh pushed to production.</p>
                  <p className="text-xs text-slate-400">2 hours ago</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div>
                  <p className="font-medium text-slate-50">Analytics detected elevated error rates in staging.</p>
                  <p className="text-xs text-slate-400">Yesterday</p>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
