"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RepositoryBadge =
  | "Docker Official Image"
  | "Verified Publisher"
  | "Sponsored OSS";

type Repository = {
  id: string;
  name: string;
  namespace: string;
  description: string;
  badges: RepositoryBadge[];
  tags: string[];
  stars: number;
  pulls: string;
  updatedAt: string;
};

const badgeDefinitions: { label: RepositoryBadge; description: string }[] = [
  {
    label: "Docker Official Image",
    description:
      "Maintained in partnership with upstream projects for trusted workloads.",
  },
  {
    label: "Verified Publisher",
    description: "Published by a verified partner with enterprise support.",
  },
  {
    label: "Sponsored OSS",
    description: "Open source projects supported directly by Docker.",
  },
];

const repositories: Repository[] = [
  {
    id: "library/nginx",
    name: "nginx",
    namespace: "library",
    description:
      "Official build of the high-performance HTTP and reverse proxy server.",
    badges: ["Docker Official Image"],
    tags: ["web server", "reverse proxy", "http", "load balancing"],
    stars: 12580,
    pulls: "1B+",
    updatedAt: "Updated 2 days ago",
  },
  {
    id: "library/postgres",
    name: "postgres",
    namespace: "library",
    description: "The world's most advanced open source relational database.",
    badges: ["Docker Official Image", "Sponsored OSS"],
    tags: ["database", "sql", "postgresql", "storage"],
    stars: 9800,
    pulls: "500M+",
    updatedAt: "Updated 5 days ago",
  },
  {
    id: "hashicorp/vault",
    name: "vault",
    namespace: "hashicorp",
    description:
      "Identity-based secrets and encryption management for modern infrastructure.",
    badges: ["Verified Publisher"],
    tags: ["security", "secrets", "encryption", "identity"],
    stars: 4200,
    pulls: "50M+",
    updatedAt: "Updated 12 hours ago",
  },
  {
    id: "bitnami/redis",
    name: "redis",
    namespace: "bitnami",
    description:
      "In-memory data structure store used as a database, cache, and message broker.",
    badges: ["Verified Publisher", "Sponsored OSS"],
    tags: ["database", "cache", "in-memory", "message broker"],
    stars: 3100,
    pulls: "200M+",
    updatedAt: "Updated 4 hours ago",
  },
  {
    id: "grafana/grafana",
    name: "grafana",
    namespace: "grafana",
    description:
      "Beautiful dashboards and data visualizations for your observability stack.",
    badges: ["Sponsored OSS"],
    tags: ["monitoring", "observability", "dashboard", "analytics"],
    stars: 2700,
    pulls: "80M+",
    updatedAt: "Updated 1 day ago",
  },
];

function computeRelevance(repo: Repository, searchQuery: string) {
  if (!searchQuery.trim()) {
    return repo.stars;
  }

  const query = searchQuery.toLowerCase();
  const nameMatch = repo.name.toLowerCase().includes(query) ? 600 : 0;
  const namespaceMatch = repo.namespace.toLowerCase().includes(query) ? 300 : 0;
  const descriptionMatch = repo.description.toLowerCase().includes(query)
    ? 200
    : 0;
  const tagMatches = repo.tags.filter((tag) =>
    tag.toLowerCase().includes(query)
  ).length;

  return (
    repo.stars +
    nameMatch +
    namespaceMatch +
    descriptionMatch +
    tagMatches * 120
  );
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBadges, setActiveBadges] = useState<RepositoryBadge[]>([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<
    string | null
  >(repositories[0]?.id ?? null);

  const filteredRepositories = useMemo(() => {
    const results = repositories
      .filter((repository) => {
        if (activeBadges.length === 0) {
          return true;
        }

        return activeBadges.every((badge) => repository.badges.includes(badge));
      })
      .filter((repository) => {
        if (!searchQuery.trim()) {
          return true;
        }

        const query = searchQuery.toLowerCase();

        return (
          repository.name.toLowerCase().includes(query) ||
          repository.namespace.toLowerCase().includes(query) ||
          repository.description.toLowerCase().includes(query) ||
          repository.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .sort(
        (a, b) =>
          computeRelevance(b, searchQuery) - computeRelevance(a, searchQuery)
      );

    return results;
  }, [activeBadges, searchQuery]);

  const selectedRepository = useMemo(() => {
    const activeSelection = selectedRepositoryId
      ? repositories.find(
          (repository) => repository.id === selectedRepositoryId
        ) ?? null
      : null;

    return activeSelection ?? filteredRepositories[0] ?? null;
  }, [filteredRepositories, selectedRepositoryId]);

  const handleToggleBadge = (badge: RepositoryBadge) => {
    setActiveBadges((current) => {
      if (current.includes(badge)) {
        return current.filter((item) => item !== badge);
      }

      return [...current, badge];
    });
  };

  const handleSelectRepository = (repositoryId: string) => {
    setSelectedRepositoryId(repositoryId);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-lg font-semibold">
                DH
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-sky-200">
                  DockerHub Clone
                </p>
                <p className="text-base font-semibold text-white">Explore</p>
              </div>
            </Link>
            <nav className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-slate-100">
              <Link
                href="/dashboard"
                className="rounded-full bg-white/10 px-4 py-2 transition hover:bg-white/20"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="rounded-full border border-white/40 px-4 py-2 transition hover:border-white hover:bg-white/10"
              >
                Profile
              </Link>
            </nav>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm uppercase tracking-[0.4em] text-sky-200">
              Discover
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Explore trusted container images from the community.
            </h1>
            <p className="text-sm text-slate-200/80">
              Search public repositories, filter by official badges, and inspect
              rich metadata before pulling images into your own workflows.
            </p>
          </div>
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                Search repositories
              </label>
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <svg
                  className="h-5 w-5 text-sky-200"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m21 21-4.35-4.35"></path>
                  <circle cx="11" cy="11" r="7"></circle>
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, tag, or publisher"
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                Filter by badge
              </p>
              <div className="flex flex-wrap gap-2">
                {badgeDefinitions.map((badge) => {
                  const isActive = activeBadges.includes(badge.label);

                  return (
                    <button
                      key={badge.label}
                      type="button"
                      onClick={() => handleToggleBadge(badge.label)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                        isActive
                          ? "bg-sky-500 text-white shadow-lg shadow-sky-500/40"
                          : "bg-white/10 text-slate-100 hover:bg-white/20"
                      }`}
                    >
                      {badge.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400">
                {activeBadges.length > 0
                  ? "Showing repositories that contain all selected badges."
                  : "Showing repositories across all trusted badges."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>{filteredRepositories.length} repositories found</span>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-sky-300 transition hover:text-sky-200"
              >
                Clear search
              </button>
            ) : null}
          </div>

          <ul className="space-y-4">
            {filteredRepositories.length > 0 ? (
              filteredRepositories.map((repository) => {
                const isSelected = selectedRepository?.id === repository.id;

                return (
                  <li key={repository.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectRepository(repository.id)}
                      className={`flex w-full flex-col gap-4 rounded-2xl border px-6 py-5 text-left transition ${
                        isSelected
                          ? "border-sky-400 bg-sky-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                            {repository.namespace}
                          </p>
                          <h2 className="text-2xl font-semibold text-white">
                            {repository.name}
                          </h2>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-200">
                          <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                            <svg
                              className="h-4 w-4 text-amber-300"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            {repository.stars.toLocaleString()} stars
                          </span>
                          <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                            <svg
                              className="h-4 w-4 text-sky-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <path d="M12 5v14" />
                              <path d="m19 12-7 7-7-7" />
                            </svg>
                            {repository.pulls} pulls
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-200/80">
                        {repository.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {repository.badges.map((badge) => (
                          <span
                            key={badge}
                            className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-sky-100"
                          >
                            {badge}
                          </span>
                        ))}
                        {repository.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/10 px-3 py-1 text-slate-100"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-slate-400">
                        {repository.updatedAt}
                      </p>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-300">
                No repositories match your current filters.
              </li>
            )}
          </ul>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
              Badge glossary
            </p>
            <ul className="mt-6 space-y-4 text-sm text-slate-100/90">
              {badgeDefinitions.map((badge) => (
                <li key={badge.label} className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">
                    {badge.label}
                  </p>
                  <p className="mt-2 text-xs text-slate-300">
                    {badge.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            {selectedRepository ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                    Selected repository
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">
                    {selectedRepository.namespace}/{selectedRepository.name}
                  </h2>
                  <p className="mt-3 text-sm text-slate-200/80">
                    {selectedRepository.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-slate-100">
                  <div className="rounded-2xl bg-white/10 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                      Stars
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {selectedRepository.stars.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                      Pulls
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {selectedRepository.pulls}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                    Badges
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-100">
                    {selectedRepository.badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                    Tags
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-100">
                    {selectedRepository.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-3 py-1"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  {selectedRepository.updatedAt}
                </p>

                <button
                  type="button"
                  className="w-full rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400"
                >
                  View repository details
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                  Selected repository
                </p>
                <p>No repository is currently selected.</p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
