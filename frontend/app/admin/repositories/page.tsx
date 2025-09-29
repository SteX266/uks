"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type RepositoryPayload,
  type UserRepository,
  createOfficialRepository,
  deleteOfficialRepository,
  fetchOfficialRepositories,
  updateOfficialRepository,
} from "../../lib/api";
import { useProtectedRoute } from "../../hooks/useProtectedRoute";

type StatusMessage = { kind: "success" | "error"; text: string } | null;

type FormState = {
  name: string;
  description: string;
  isPublic: "public" | "private";
};

const emptyForm: FormState = {
  name: "",
  description: "",
  isPublic: "public",
};

function sanitize(values: FormState): RepositoryPayload {
  const name = values.name.trim();
  const description = values.description.trim();

  return {
    name,
    description: description.length > 0 ? description : null,
    isPublic: values.isPublic === "public",
  };
}

export default function AdminRepositoriesPage() {
  const { user, isLoading: isAuthorizing } = useProtectedRoute({
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    redirectOnFail: "/dashboard",
  });
  const [repositories, setRepositories] = useState<UserRepository[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isAuthorizing || !user) {
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setStatus(null);

    fetchOfficialRepositories()
      .then((data) => {
        if (!isActive) return;
        setRepositories(data);
        if (data.length > 0) {
          setSelectedId((current) => current ?? data[0].id);
        } else {
          setSelectedId(null);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load official repositories.";
        setStatus({ kind: "error", text: message });
        setRepositories([]);
        setSelectedId(null);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isAuthorizing, user]);

  useEffect(() => {
    if (selectedId == null) {
      setEditForm(emptyForm);
      return;
    }

    const target = repositories.find((repo) => repo.id === selectedId);
    if (!target) {
      setEditForm(emptyForm);
      return;
    }

    setEditForm({
      name: target.name,
      description: target.description ?? "",
      isPublic: target.isPublic ? "public" : "private",
    });
  }, [repositories, selectedId]);

  const filteredRepositories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return repositories;
    }

    return repositories.filter((repository) => {
      return (
        repository.name.toLowerCase().includes(query) ||
        (repository.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [repositories, searchTerm]);

  const selectedRepository = useMemo(() => {
    if (selectedId == null) {
      return null;
    }
    return repositories.find((repo) => repo.id === selectedId) ?? null;
  }, [repositories, selectedId]);

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRepository) {
      setStatus({
        kind: "error",
        text: "Select an official repository to update.",
      });
      return;
    }

    const payload = sanitize(editForm);
    if (!payload.name) {
      setStatus({ kind: "error", text: "Repository name is required." });
      return;
    }

    try {
      setIsSaving(true);
      const updated = await updateOfficialRepository(selectedRepository.id, payload);
      setRepositories((previous) =>
        previous.map((repo) => (repo.id === updated.id ? updated : repo)),
      );
      setStatus({
        kind: "success",
        text: `Updated ${updated.name} successfully.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update the repository.";
      setStatus({ kind: "error", text: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRepository) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteOfficialRepository(selectedRepository.id);
      setRepositories((previous) =>
        previous.filter((repo) => repo.id !== selectedRepository.id),
      );
      setStatus({
        kind: "success",
        text: `Deleted ${selectedRepository.name}.`,
      });
      setSelectedId(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete the repository.";
      setStatus({ kind: "error", text: message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = sanitize(createForm);

    if (!payload.name) {
      setCreateError("Repository name is required.");
      return;
    }

    try {
      setIsCreating(true);
      const created = await createOfficialRepository(payload);
      setRepositories((previous) =>
        [...previous, created].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        ),
      );
      setStatus({
        kind: "success",
        text: `Created official repository ${created.name}.`,
      });
      setCreateForm(emptyForm);
      setShowCreateForm(false);
      setSelectedId(created.id);
      setCreateError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create the official repository.";
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (isAuthorizing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
        <p className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm uppercase tracking-[0.4em] text-sky-200">
          Loading official repositories...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
          <div className="border-b border-white/10">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
              <Link href="/admin/dashboard" className="flex items-center gap-3 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-lg font-semibold">
                  DH
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.4em] text-sky-200">
                    DockerHub Clone
                  </p>
                  <p className="text-base font-semibold text-white">Official repositories</p>
                </div>
              </Link>
              <nav className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-slate-100">
                <Link
                  href="/admin/dashboard"
                  className="rounded-full border border-white/40 px-4 py-2 transition hover:border-white hover:bg-white/10"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="rounded-full border border-white/40 px-4 py-2 transition hover:border-white hover:bg-white/10"
                >
                  Users
                </Link>
                <Link
                  href="/admin/repositories"
                  aria-current="page"
                  className="rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
                >
                  Repositories
                </Link>
                <Link
                  href="/admin/analytics"
                  className="rounded-full border border-white/40 px-4 py-2 transition hover:border-white hover:bg-white/10"
                >
                  Analytics
                </Link>
                <Link
                  href="/explore"
                  className="rounded-full border border-white/40 px-4 py-2 transition hover:border-white hover:bg-white/10"
                >
                  Explore
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {status && (
          <div
            className={`rounded-3xl border p-4 text-sm shadow-lg shadow-black/20 backdrop-blur transition ${
              status.kind === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-100"
            }`}
            role="status"
            aria-live="polite"
          >
            {status.text}
          </div>
        )}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-black/30 backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Docker Official Images
              </h2>
              <p className="mt-2 text-sm text-slate-300/80">
                Create and maintain trusted base images for the entire community.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(true);
                setCreateError(null);
              }}
              className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400"
            >
              + New official repository
            </button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search official repositories"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                />
                <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-slate-300/80">
                  {isLoading ? "Loading..." : `${filteredRepositories.length} items`}
                </span>
              </div>

              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-slate-950/40">
                {isLoading ? (
                  <p className="p-6 text-sm text-slate-300">Loading official repositories...</p>
                ) : filteredRepositories.length === 0 ? (
                  <p className="p-6 text-sm text-slate-300">No official repositories found.</p>
                ) : (
                  filteredRepositories.map((repository) => (
                    <button
                      key={repository.id}
                      type="button"
                      onClick={() => setSelectedId(repository.id)}
                      className={`flex w-full flex-col gap-2 px-6 py-4 text-left transition hover:bg-white/5 ${
                        selectedId === repository.id ? "bg-white/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300/80">
                        <span className="rounded-full bg-slate-900/80 px-2 py-1 text-xs font-semibold uppercase tracking-widest">
                          Docker Official Image
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-sky-300">
                          {repository.isPublic ? "Public" : "Private"}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">{repository.name}</h3>
                      <p className="text-sm text-slate-300/80">
                        {repository.description ?? "No description provided."}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-white">Repository details</h3>
                {selectedRepository ? (
                  <form onSubmit={handleUpdate} className="mt-6 space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Name
                      </label>
                      <input
                        value={editForm.name}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        placeholder="official-image"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            description: event.target.value,
                          }))
                        }
                        className="mt-2 min-h-[120px] w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        placeholder="Describe this official image"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Visibility
                      </label>
                      <select
                        value={editForm.isPublic}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            isPublic: event.target.value as FormState["isPublic"],
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-500/50"
                      >
                        {isSaving ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="rounded-full border border-rose-400 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-rose-100 transition hover:border-rose-200 hover:text-white disabled:cursor-not-allowed disabled:border-rose-400/60 disabled:text-rose-200"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-6 text-sm text-slate-300/80">
                    Select an official repository to review or modify its settings.
                  </p>
                )}
              </div>

              {showCreateForm ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Create official repository</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setCreateError(null);
                        setCreateForm(emptyForm);
                      }}
                      className="text-xs uppercase tracking-wide text-slate-300 transition hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <form onSubmit={handleCreate} className="mt-6 space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Name
                      </label>
                      <input
                        value={createForm.name}
                        onChange={(event) =>
                          setCreateForm((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        placeholder="official-image"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Description
                      </label>
                      <textarea
                        value={createForm.description}
                        onChange={(event) =>
                          setCreateForm((previous) => ({
                            ...previous,
                            description: event.target.value,
                          }))
                        }
                        className="mt-2 min-h-[100px] w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        placeholder="Describe this official image"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Visibility
                      </label>
                      <select
                        value={createForm.isPublic}
                        onChange={(event) =>
                          setCreateForm((previous) => ({
                            ...previous,
                            isPublic: event.target.value as FormState["isPublic"],
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    {createError ? (
                      <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                        {createError}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setCreateError(null);
                          setCreateForm(emptyForm);
                        }}
                        className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-500/60"
                      >
                        {isCreating ? "Creating..." : "Create"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
