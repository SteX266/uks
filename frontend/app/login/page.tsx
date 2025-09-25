"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await loginUser({ username, password });
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("username", username);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-12">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl shadow-2xl md:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden bg-gradient-to-br from-sky-500 via-blue-700 to-slate-900 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-sky-200">
              Welcome back
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Sign in to manage your containers and automate your workflows.
            </h1>
          </div>
          <div className="mt-12 space-y-6 text-sm text-sky-100">
            <div>
              <p className="font-semibold uppercase tracking-wide text-sky-200">
                Single sign-on
              </p>
              <p className="mt-2 leading-relaxed">
                Use the same credentials you use across your organization. Keep
                everything synchronized and secure.
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-sky-200">
                Private registries
              </p>
              <p className="mt-2 leading-relaxed">
                Access private images, manage collaborators, and see repository
                insights in real time.
              </p>
            </div>
          </div>
        </section>
        <section className="bg-white p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-slate-900">
                Login to DockerHub Clone
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-sky-600 hover:text-sky-500"
                >
                  Create one now
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-slate-700"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="your-username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-200 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="mt-12 text-center text-xs text-slate-400">
              Protected by modern container security practices.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
