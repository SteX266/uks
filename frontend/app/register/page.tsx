"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await registerUser({ username, email, password });
      setSuccessMessage("Account created! You can now sign in.");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-12">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl shadow-2xl md:grid-cols-[0.95fr_1.05fr]">
        <section className="bg-white p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-slate-900">
                Create your DockerHub Clone account
              </h1>
              <p className="mt-3 text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-sky-600 hover:text-sky-500"
                >
                  Sign in instead
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
                  placeholder="awesome-dev"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="you@example.com"
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
                  placeholder="Create a strong password"
                />
              </div>

              {error ? (
                <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </p>
              ) : null}

              {successMessage ? (
                <p className="rounded-lg bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-700">
                  {successMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-200 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>
          </div>
        </section>
        <section className="relative hidden bg-gradient-to-br from-sky-500 via-blue-700 to-slate-900 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-sky-200">
              Build faster
            </p>
            <h2 className="mt-6 text-4xl font-semibold leading-tight">
              Store, share, and deploy container images with confidence.
            </h2>
          </div>
          <div className="mt-12 space-y-6 text-sm text-sky-100">
            <div>
              <p className="font-semibold uppercase tracking-wide text-sky-200">
                Teams ready
              </p>
              <p className="mt-2 leading-relaxed">
                Invite teammates, manage roles, and collaborate on secure
                private registries effortlessly.
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-sky-200">
                Automated builds
              </p>
              <p className="mt-2 leading-relaxed">
                Connect your Git provider to trigger image builds on every push,
                just like DockerHub.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
