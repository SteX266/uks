"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Visibility = "public" | "private";
type Ownership = "personal" | "organization";

interface Repository {
  id: string;
  name: string;
  description: string;
  visibility: Visibility;
  ownership: Ownership;
  organization?: string;
  tags: Tag[];
  updatedAt: string;
  collaborators: string[];
}

interface Tag {
  name: string;
  updatedAt: string;
}

const organizations = ["Northwind Labs", "Team Atlas", "Pixel Foundry"];

function classNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

const initialRepositories: Repository[] = [
  {
    id: "repo-1",
    name: "payment-service",
    description: "Handles payment orchestration and fraud detection.",
    visibility: "private",
    ownership: "organization",
    organization: "Northwind Labs",
    updatedAt: "2024-02-22",
    tags: [
      { name: "v1.3.0", updatedAt: "2024-02-22" },
      { name: "staging", updatedAt: "2024-02-18" },
      { name: "latest", updatedAt: "2024-02-10" },
    ],
    collaborators: ["maria.alvarez", "li.wei", "ops-team"],
  },
  {
    id: "repo-2",
    name: "personal-blog",
    description: "Static site served via nginx and refreshed nightly.",
    visibility: "public",
    ownership: "personal",
    updatedAt: "2024-01-30",
    tags: [
      { name: "v2.0.1", updatedAt: "2024-01-30" },
      { name: "latest", updatedAt: "2024-01-30" },
    ],
    collaborators: ["alex.dev"],
  },
  {
    id: "repo-3",
    name: "predictive-api",
    description: "ML inference microservice for churn predictions.",
    visibility: "private",
    ownership: "organization",
    organization: "Team Atlas",
    updatedAt: "2024-02-01",
    tags: [
      { name: "v0.9.5", updatedAt: "2024-02-01" },
      { name: "candidate", updatedAt: "2024-01-28" },
    ],
    collaborators: ["data-science", "qa-reviewers"],
  },
  {
    id: "repo-4",
    name: "ci-builder",
    description: "Reusable CI image with tooling baked in.",
    visibility: "public",
    ownership: "organization",
    organization: "Pixel Foundry",
    updatedAt: "2024-02-12",
    tags: [
      { name: "stable", updatedAt: "2024-02-12" },
      { name: "nightly", updatedAt: "2024-02-11" },
    ],
    collaborators: ["ci-admins", "release-managers"],
  },
];

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState(initialRepositories);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<
    string | null
  >(initialRepositories[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | Visibility>(
    "all"
  );
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | Ownership>(
    "all"
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [tagSort, setTagSort] = useState<"name" | "recent">("recent");
  const [editMode, setEditMode] = useState(false);

  const selectedRepository = repositories.find(
    (repo) => repo.id === selectedRepositoryId
  );

  const filteredRepositories = useMemo(() => {
    return repositories.filter((repo) => {
      const matchesSearch = repo.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesVisibility =
        visibilityFilter === "all" || repo.visibility === visibilityFilter;
      const matchesOwnership =
        ownershipFilter === "all" || repo.ownership === ownershipFilter;
      return matchesSearch && matchesVisibility && matchesOwnership;
    });
  }, [repositories, search, visibilityFilter, ownershipFilter]);

  const filteredTags = useMemo(() => {
    if (!selectedRepository) {
      return [];
    }

    const filtered = selectedRepository.tags.filter((tag) =>
      tag.name.toLowerCase().includes(tagSearch.toLowerCase())
    );

    if (tagSort === "name") {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...filtered].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [selectedRepository, tagSearch, tagSort]);

  const handleCreateRepository = (payload: {
    name: string;
    description: string;
    visibility: Visibility;
    ownership: Ownership;
    organization?: string;
    collaborators: string[];
  }) => {
    const newRepository: Repository = {
      id: `repo-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      visibility: payload.visibility,
      ownership: payload.ownership,
      organization:
        payload.ownership === "organization" ? payload.organization : undefined,
      tags: [],
      updatedAt: new Date().toISOString().slice(0, 10),
      collaborators: payload.collaborators,
    };

    setRepositories((prev) => [newRepository, ...prev]);
    setSelectedRepositoryId(newRepository.id);
    setShowCreateModal(false);
  };

  const handleUpdateRepository = (payload: {
    name: string;
    description: string;
    visibility: Visibility;
    collaborators: string[];
  }) => {
    if (!selectedRepository) return;

    setRepositories((prev) =>
      prev.map((repo) =>
        repo.id === selectedRepository.id
          ? {
              ...repo,
              name: payload.name,
              description: payload.description,
              visibility: payload.visibility,
              collaborators: payload.collaborators,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : repo
      )
    );
    setEditMode(false);
  };

  const handleDeleteRepository = () => {
    if (!selectedRepository) return;

    setRepositories((prev) =>
      prev.filter((repo) => repo.id !== selectedRepository.id)
    );
    setSelectedRepositoryId((prevId) => {
      if (prevId === selectedRepository.id) {
        return (
          repositories.find((repo) => repo.id !== selectedRepository.id)?.id ??
          null
        );
      }
      return prevId;
    });
    setShowDeletePrompt(false);
  };

  const handleDeleteTag = (tagName: string) => {
    if (!selectedRepository) return;

    setRepositories((prev) =>
      prev.map((repo) =>
        repo.id === selectedRepository.id
          ? {
              ...repo,
              tags: repo.tags.filter((tag) => tag.name !== tagName),
            }
          : repo
      )
    );
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
                <p className="text-base font-semibold text-white">
                  Repositories
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-slate-100">
              <Link
                href="/dashboard"
                className="rounded-full border border-white/40 px-4 py-2 transition hover:border-white hover:bg-white/10"
              >
                Dashboard
              </Link>
              <Link
                href="/repositories"
                aria-current="page"
                className="rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
              >
                Repositories
              </Link>
              <Link
                href="/explore"
                className="rounded-full border border-white/40 px-4 py-2 transition hover:border-white hover:bg-white/10"
              >
                Explore
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
      </header>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
              Repositories
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Manage your registries
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300/80">
              View personal and organization repositories, adjust their
              settings, and curate tags used for container images.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400"
          >
            + New repository
          </button>
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 gap-3">
                  <div className="relative flex-1">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search repositories"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                    />
                  </div>
                  <select
                    value={ownershipFilter}
                    onChange={(event) =>
                      setOwnershipFilter(
                        event.target.value as "all" | Ownership
                      )
                    }
                    className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                  >
                    <option value="all">All owners</option>
                    <option value="personal">Personal</option>
                    <option value="organization">Organizations</option>
                  </select>
                  <select
                    value={visibilityFilter}
                    onChange={(event) =>
                      setVisibilityFilter(
                        event.target.value as "all" | Visibility
                      )
                    }
                    className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                  >
                    <option value="all">All visibility</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 divide-y divide-white/5 rounded-xl border border-white/10 bg-slate-950/40">
                {filteredRepositories.length === 0 && (
                  <div className="p-6 text-sm text-slate-300/60">
                    No repositories match the selected filters.
                  </div>
                )}
                {filteredRepositories.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => {
                      setSelectedRepositoryId(repo.id);
                      setTagSearch("");
                      setTagSort("recent");
                    }}
                    className={classNames(
                      "w-full px-6 py-5 text-left transition hover:bg-white/5 focus:outline-none",
                      selectedRepositoryId === repo.id && "bg-white/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-300/80">
                          <span className="rounded-full bg-slate-900/80 px-2 py-1 text-xs font-semibold uppercase tracking-widest">
                            {repo.ownership === "personal"
                              ? "Personal"
                              : repo.organization}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-sky-300">
                            {repo.visibility === "public"
                              ? "Public"
                              : "Private"}
                          </span>
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-white">
                          {repo.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-300/80">
                          {repo.description}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        Updated {formatDate(repo.updatedAt)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            {selectedRepository ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                        Repository details
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">
                        {selectedRepository.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-300/80">
                        {selectedRepository.description}
                      </p>
                      <dl className="mt-4 grid gap-2 text-xs text-slate-300/70">
                        <div className="flex items-center gap-2">
                          <dt className="w-28 uppercase tracking-wide text-slate-400">
                            Visibility
                          </dt>
                          <dd className="rounded-full bg-slate-900/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-sky-200">
                            {selectedRepository.visibility}
                          </dd>
                        </div>
                        <div className="flex items-center gap-2">
                          <dt className="w-28 uppercase tracking-wide text-slate-400">
                            Owner
                          </dt>
                          <dd className="text-sm text-white">
                            {selectedRepository.ownership === "personal"
                              ? "Personal account"
                              : selectedRepository.organization}
                          </dd>
                        </div>
                        <div className="flex items-center gap-2">
                          <dt className="w-28 uppercase tracking-wide text-slate-400">
                            Updated
                          </dt>
                          <dd>{formatDate(selectedRepository.updatedAt)}</dd>
                        </div>
                      </dl>
                      <div className="mt-5 space-y-2 text-xs">
                        <p className="uppercase tracking-wide text-slate-400">
                          Collaborators
                        </p>
                        {selectedRepository.collaborators.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedRepository.collaborators.map(
                              (collaborator) => (
                                <span
                                  key={collaborator}
                                  className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-200"
                                >
                                  {collaborator}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-300/70">
                            No collaborators yet. Add teammates to share access.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <button
                        onClick={() => setEditMode((prev) => !prev)}
                        className="rounded-full border border-white/30 px-4 py-2 font-semibold uppercase tracking-wide text-white transition hover:border-sky-400 hover:text-sky-200"
                      >
                        {editMode ? "Close" : "Edit settings"}
                      </button>
                      <button
                        onClick={() => setShowDeletePrompt(true)}
                        className="rounded-full border border-rose-500/40 px-4 py-2 font-semibold uppercase tracking-wide text-rose-300 transition hover:border-rose-400 hover:text-rose-200"
                      >
                        Delete repository
                      </button>
                    </div>
                  </div>

                  {editMode && (
                    <RepositoryEditForm
                      repository={selectedRepository}
                      onSubmit={handleUpdateRepository}
                    />
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                        Tags
                      </p>
                      <h4 className="mt-1 text-lg font-semibold text-white">
                        {filteredTags.length} tags
                      </h4>
                      <p className="mt-2 text-xs text-slate-300/70">
                        Tags are created via <code>docker push</code>. Remove
                        unused tags to keep things tidy.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={tagSearch}
                        onChange={(event) => setTagSearch(event.target.value)}
                        placeholder="Search tags"
                        className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-xs outline-none transition focus:border-sky-400"
                      />
                      <select
                        value={tagSort}
                        onChange={(event) =>
                          setTagSort(event.target.value as "name" | "recent")
                        }
                        className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-xs outline-none transition focus:border-sky-400"
                      >
                        <option value="recent">Newest</option>
                        <option value="name">Name</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {filteredTags.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/20 px-4 py-5 text-center text-xs text-slate-300/70">
                        No tags match the filters. Push a tag from your terminal
                        to see it here.
                      </div>
                    ) : (
                      filteredTags.map((tag) => (
                        <div
                          key={tag.name}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {tag.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              Updated {formatDate(tag.updatedAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteTag(tag.name)}
                            className="text-xs font-semibold uppercase tracking-wide text-rose-300 transition hover:text-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950/40 p-8 text-center text-sm text-slate-300/70">
                Select a repository to see details and manage settings.
              </div>
            )}
          </aside>
        </section>
      </div>

      {showCreateModal && (
        <CreateRepositoryModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRepository}
        />
      )}

      {showDeletePrompt && selectedRepository && (
        <DeleteRepositoryPrompt
          repositoryName={selectedRepository.name}
          onCancel={() => setShowDeletePrompt(false)}
          onConfirm={handleDeleteRepository}
        />
      )}
    </main>
  );
}

interface RepositoryFormProps {
  repository?: Repository;
  onSubmit: (payload: {
    name: string;
    description: string;
    visibility: Visibility;
    ownership?: Ownership;
    organization?: string;
    collaborators: string[];
  }) => void;
}

function RepositoryEditForm({ repository, onSubmit }: RepositoryFormProps) {
  const [name, setName] = useState(repository?.name ?? "");
  const [description, setDescription] = useState(repository?.description ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    repository?.visibility ?? "public"
  );
  const [collaborators, setCollaborators] = useState<string[]>(
    repository?.collaborators ?? []
  );
  const [collaboratorInput, setCollaboratorInput] = useState("");

  const handleAddCollaborator = () => {
    const value = collaboratorInput.trim();
    if (!value || collaborators.includes(value)) {
      setCollaboratorInput("");
      return;
    }

    setCollaborators((prev) => [...prev, value]);
    setCollaboratorInput("");
  };

  const handleRemoveCollaborator = (value: string) => {
    setCollaborators((prev) => prev.filter((item) => item !== value));
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          name,
          description,
          visibility,
          collaborators,
        });
      }}
      className="mt-6 space-y-4 rounded-xl border border-white/10 bg-slate-950/60 p-5"
    >
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Name
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
          required
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Description
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 h-24 w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Visibility
        </label>
        <div className="mt-2 flex gap-3 text-xs">
          {(["public", "private"] as Visibility[]).map((item) => (
            <label
              key={item}
              className={classNames(
                "flex items-center gap-2 rounded-full border px-3 py-2 transition",
                visibility === item
                  ? "border-sky-400 bg-sky-500/10 text-sky-200"
                  : "border-white/10 bg-slate-950/40 text-slate-300"
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={item}
                checked={visibility === item}
                onChange={() => setVisibility(item)}
                className="accent-sky-400"
              />
              {item}
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
          <label>Collaborators</label>
          <span className="text-[11px] text-slate-300/70">
            {collaborators.length} added
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-300/70">
          Add usernames or team slugs to share push and pull access.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={collaboratorInput}
            onChange={(event) => setCollaboratorInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddCollaborator();
              }
            }}
            placeholder="devops-team"
            className="flex-1 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
          />
          <button
            type="button"
            onClick={handleAddCollaborator}
            className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400"
          >
            Add
          </button>
        </div>
        {collaborators.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {collaborators.map((collaborator) => (
              <span
                key={collaborator}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-200"
              >
                {collaborator}
                <button
                  type="button"
                  onClick={() => handleRemoveCollaborator(collaborator)}
                  className="text-[10px] uppercase tracking-wide text-slate-200 transition hover:text-white"
                >
                  Remove
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400"
      >
        Save changes
      </button>
    </form>
  );
}

interface CreateRepositoryModalProps {
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    description: string;
    visibility: Visibility;
    ownership: Ownership;
    organization?: string;
    collaborators: string[];
  }) => void;
}

function CreateRepositoryModal({
  onClose,
  onSubmit,
}: CreateRepositoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [ownership, setOwnership] = useState<Ownership>("personal");
  const [organization, setOrganization] = useState(organizations[0]);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [collaboratorInput, setCollaboratorInput] = useState("");

  const handleAddCollaborator = () => {
    const value = collaboratorInput.trim();
    if (!value || collaborators.includes(value)) {
      setCollaboratorInput("");
      return;
    }

    setCollaborators((prev) => [...prev, value]);
    setCollaboratorInput("");
  };

  const handleRemoveCollaborator = (value: string) => {
    setCollaborators((prev) => prev.filter((item) => item !== value));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950/90 p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
              New repository
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Create a repository
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide text-slate-300 transition hover:border-white/40 hover:text-white"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({
              name,
              description,
              visibility,
              ownership,
              organization:
                ownership === "organization" ? organization : undefined,
              collaborators,
            });
            setName("");
            setDescription("");
            setVisibility("public");
            setOwnership("personal");
            setOrganization(organizations[0]);
            setCollaborators([]);
            setCollaboratorInput("");
          }}
          className="mt-6 space-y-5"
        >
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="registry/app-service"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short summary for your collaborators"
              className="mt-1 h-24 w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Visibility
            </label>
            <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
              {(["public", "private"] as Visibility[]).map((item) => (
                <label
                  key={item}
                  className={classNames(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
                    visibility === item
                      ? "border-sky-400 bg-sky-500/10 text-sky-200"
                      : "border-white/10 bg-slate-950/40 text-slate-300"
                  )}
                >
                  <input
                    type="radio"
                    name="modal-visibility"
                    value={item}
                    checked={visibility === item}
                    onChange={() => setVisibility(item)}
                    className="accent-sky-400"
                  />
                  {item === "public"
                    ? "Public - visible to everyone"
                    : "Private - restricted access"}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Repository owner
            </label>
            <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
              <label
                className={classNames(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
                  ownership === "personal"
                    ? "border-sky-400 bg-sky-500/10 text-sky-200"
                    : "border-white/10 bg-slate-950/40 text-slate-300"
                )}
              >
                <input
                  type="radio"
                  name="ownership"
                  value="personal"
                  checked={ownership === "personal"}
                  onChange={() => setOwnership("personal")}
                  className="accent-sky-400"
                />
                Personal account
              </label>
              <label
                className={classNames(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
                  ownership === "organization"
                    ? "border-sky-400 bg-sky-500/10 text-sky-200"
                    : "border-white/10 bg-slate-950/40 text-slate-300"
                )}
              >
                <input
                  type="radio"
                  name="ownership"
                  value="organization"
                  checked={ownership === "organization"}
                  onChange={() => setOwnership("organization")}
                  className="accent-sky-400"
                />
                Organization
              </label>
            </div>
            {ownership === "organization" && (
              <div className="mt-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Choose organization
                </label>
                <select
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
                >
                  {organizations.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
              <label>Collaborators</label>
              <span className="text-[11px] text-slate-300/70">
                {collaborators.length} added
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300/70">
              Invite teammates now or update access later from repository
              settings.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={collaboratorInput}
                onChange={(event) => setCollaboratorInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddCollaborator();
                  }
                }}
                placeholder="username or team"
                className="flex-1 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
              />
              <button
                type="button"
                onClick={handleAddCollaborator}
                className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400"
              >
                Add
              </button>
            </div>
            {collaborators.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {collaborators.map((collaborator) => (
                  <span
                    key={collaborator}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-200"
                  >
                    {collaborator}
                    <button
                      type="button"
                      onClick={() => handleRemoveCollaborator(collaborator)}
                      className="text-[10px] uppercase tracking-wide text-slate-200 transition hover:text-white"
                    >
                      Remove
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs text-slate-300/70">
            <p className="font-semibold text-white">Heads up</p>
            <p className="mt-1">
              Tags are created automatically when you push an image. Use
              <code className="mx-1 rounded bg-slate-900 px-1 py-0.5">
                docker push
              </code>
              from your terminal to publish and version images.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-white/40 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400"
            >
              Create repository
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteRepositoryPromptProps {
  repositoryName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteRepositoryPrompt({
  repositoryName,
  onCancel,
  onConfirm,
}: DeleteRepositoryPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-950/90 p-8 text-slate-100 shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-300">
          Danger zone
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Delete repository?
        </h2>
        <p className="mt-3 text-sm text-slate-300/80">
          This will permanently delete{" "}
          <span className="font-semibold text-white">{repositoryName}</span> and
          remove all tags associated with it. This action cannot be undone.
        </p>
        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            onClick={onCancel}
            className="rounded-full border border-white/20 px-5 py-2 font-semibold uppercase tracking-wide text-slate-300 transition hover:border-white/40 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-rose-500 px-5 py-2 font-semibold uppercase tracking-wide text-white transition hover:bg-rose-400"
          >
            Delete repository
          </button>
        </div>
      </div>
    </div>
  );
}
