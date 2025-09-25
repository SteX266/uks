import Link from "next/link";

const highlights = [
  {
    title: "Secure registries",
    description:
      "Create private repositories, manage fine-grained permissions, and audit image usage for your organization.",
  },
  {
    title: "Automated builds",
    description:
      "Connect source control providers and ship updated images on every merge with cloud-native pipelines.",
  },
  {
    title: "Global distribution",
    description:
      "Deliver container images to teams around the world with a robust CDN and intelligent caching.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 pb-20 text-white">
      <header className="mx-auto flex max-w-6xl flex-col gap-10 py-20 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.4em] text-sky-200">
            DockerHub Clone
          </p>
          <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
            Build, ship, and run containers with confidence.
          </h1>
          <p className="mt-6 text-lg text-slate-200/80">
            A modern DockerHub experience with beautiful dashboards, streamlined
            authentication, and first-class collaboration tools for developers
            and teams.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-wide">
            <Link
              href="/register"
              className="rounded-full bg-sky-500 px-8 py-3 text-white transition hover:bg-sky-400"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/30 px-8 py-3 text-white transition hover:border-white hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-8 shadow-2xl">
          <div className="absolute -right-24 -top-24 h-52 w-52 rounded-full bg-sky-500/30 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="relative space-y-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-sky-200">
              <span>Latest activity</span>
              <span>Live</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-100/90">
              <li className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div>
                  <p className="font-medium text-white">
                    automated-builds pushes a new image tag.
                  </p>
                  <p className="text-xs text-slate-400">
                    less than a minute ago
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-400" />
                <div>
                  <p className="font-medium text-white">
                    devops-team added a collaborator.
                  </p>
                  <p className="text-xs text-slate-400">5 minutes ago</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div>
                  <p className="font-medium text-white">
                    security-scanner found 0 vulnerabilities.
                  </p>
                  <p className="text-xs text-slate-400">12 minutes ago</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl">
        <h2 className="text-sm uppercase tracking-[0.4em] text-sky-200">
          Why teams choose us
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur"
            >
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-4 text-sm text-slate-200/80">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
