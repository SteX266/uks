"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const savedUsername = localStorage.getItem("username");

    if (!token) {
      router.replace("/login");
      return;
    }

    setUsername(savedUsername);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-lg font-semibold">
              DH
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-sky-200">
                DockerHub Clone
              </p>
              <h1 className="text-xl font-semibold">
                Developer control center
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden rounded-full bg-white/5 px-4 py-2 text-slate-100 md:inline-flex">
              {username ?? "Loading..."}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-full bg-sky-500 px-4 py-2 font-semibold uppercase tracking-wide text-sm text-white transition hover:bg-sky-400"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-br from-sky-500 via-blue-700 to-slate-900 p-10 shadow-xl">
            <p className="text-sm uppercase tracking-[0.4em] text-sky-100">
              Welcome {username ?? ""}
            </p>
            <h2 className="mt-6 text-4xl font-semibold leading-tight">
              Your registries, automated builds, and deployment workflows are
              ready.
            </h2>
            <p className="mt-6 max-w-xl text-sm text-sky-100/80">
              Start by publishing your first image, invite collaborators, or
              explore trending repositories from the community.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-wide">
              <Link
                href="/repositories"
                className="rounded-full bg-white px-6 py-3 text-slate-900 transition hover:bg-slate-200"
              >
                View repositories
              </Link>
              <Link
                href="/explore"
                className="rounded-full border border-white/50 px-6 py-3 text-white transition hover:border-white hover:bg-white/10"
              >
                Explore community
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                Deployment insights
              </p>
              <h3 className="mt-3 text-xl font-semibold">Automated builds</h3>
              <p className="mt-3 text-sm text-slate-200/80">
                Connect your GitHub repository to trigger Docker image builds on
                every push. Keep your tags in sync without manual steps.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                Security
              </p>
              <h3 className="mt-3 text-xl font-semibold">Image scanning</h3>
              <p className="mt-3 text-sm text-slate-200/80">
                Ship confidently with built-in vulnerability scanning and
                actionable remediation guidance.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
              Quick actions
            </p>
            <ul className="mt-6 space-y-4 text-sm text-slate-100/90">
              <li>
                <Link
                  href="/repositories"
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
                >
                  Create repository
                  <span aria-hidden className="text-lg">
                    →
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
                >
                  Update profile
                  <span aria-hidden className="text-lg">
                    →
                  </span>
                </Link>
              </li>
              <li>
                <a
                  href="https://docs.docker.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
                >
                  Read documentation
                  <span aria-hidden className="text-lg">
                    ↗
                  </span>
                </a>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
              Activity feed
            </p>
            <ul className="mt-6 space-y-4 text-sm text-slate-100/80">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div>
                  <p className="font-medium text-slate-50">
                    Push a new image to kickstart your first project.
                  </p>
                  <p className="text-xs text-slate-400">No activity yet</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-400" />
                <div>
                  <p className="font-medium text-slate-50">
                    Invite collaborators and manage team access.
                  </p>
                  <p className="text-xs text-slate-400">Pending</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div>
                  <p className="font-medium text-slate-50">
                    Enable vulnerability scanning to secure your images.
                  </p>
                  <p className="text-xs text-slate-400">Recommended</p>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
