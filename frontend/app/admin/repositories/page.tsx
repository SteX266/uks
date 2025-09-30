"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  type RepositoryArtifact,
  type RepositoryPayload,
  type RepositoryTag,
  type UserRepository,
  createRepository,
  createRepositoryArtifact,
  createRepositoryTag,
  deleteRepository as deleteRepositoryApi,
  deleteRepositoryTag,
  fetchMyRepositories,
  fetchRepositoryArtifacts,
  fetchRepositoryTags,
  updateRepository,
} from "../../lib/api";

type VisibilityOption = "public" | "private";

type RepositoryFormValues = {
  name: string;
  description: string;
  visibility: VisibilityOption;
  isOfficial: boolean;
};

const DEFAULT_MEDIA_TYPE =
  "application/vnd.docker.distribution.manifest.v2+json";

function classNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBytes(size: number | null | undefined) {
  if (size == null || Number.isNaN(size)) {
    return "Unknown";
  }

  if (size <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const base = 1024;
  const exponent = Math.min(
    Math.floor(Math.log(size) / Math.log(base)),
    units.length - 1
  );
  const value = size / base ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
}

function sanitizePayload(values: RepositoryFormValues): RepositoryPayload {
  const name = values.name.trim();
  const description = values.description.trim();

  return {
    name,
    description: description.length > 0 ? description : null,
    isPublic: values.visibility === "public",
    isOfficial: values.isOfficial,
  };
}

export default function RepositoriesPage() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<UserRepository[]>([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<
    number | null
  >(null);
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | VisibilityOption
  >("all");
  const [tagSearch, setTagSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [tagsByRepository, setTagsByRepository] = useState<
    Record<number, RepositoryTag[]>
  >({});
  const [tagLoading, setTagLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagDeletePending, setTagDeletePending] = useState<string | null>(null);
  const [artifactsByRepository, setArtifactsByRepository] = useState<
    Record<number, RepositoryArtifact[]>
  >({});
  const [artifactLoading, setArtifactLoading] = useState(false);
  const [artifactError, setArtifactError] = useState<string | null>(null);
  const [pushTagName, setPushTagName] = useState("");
  const [pushDigest, setPushDigest] = useState("");
  const [pushSize, setPushSize] = useState("");
  const [pushMediaType, setPushMediaType] = useState(DEFAULT_MEDIA_TYPE);
  const [pushError, setPushError] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchMyRepositories()
      .then((data) => {
        if (!isMounted) return;
        setRepositories(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load repositories.";
        setError(message);
        setRepositories([]);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (repositories.length === 0) {
      setSelectedRepositoryId(null);
      return;
    }

    setSelectedRepositoryId((current) => {
      if (current != null && repositories.some((repo) => repo.id === current)) {
        return current;
      }
      return repositories[0]?.id ?? null;
    });
  }, [repositories]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const filteredRepositories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return repositories
      .filter((repo) => {
        if (!query) {
          return true;
        }
        return (
          repo.name.toLowerCase().includes(query) ||
          (repo.description ?? "").toLowerCase().includes(query)
        );
      })
      .filter((repo) => {
        if (visibilityFilter === "all") {
          return true;
        }
        return visibilityFilter === "public" ? repo.isPublic : !repo.isPublic;
      });
  }, [repositories, search, visibilityFilter]);

  useEffect(() => {
    if (filteredRepositories.length === 0) {
      setSelectedRepositoryId(null);
      return;
    }

    setSelectedRepositoryId((current) => {
      if (
        current == null ||
        !filteredRepositories.some((repo) => repo.id === current)
      ) {
        return filteredRepositories[0]?.id ?? null;
      }
      return current;
    });
  }, [filteredRepositories]);

  const selectedRepository = useMemo(() => {
    if (selectedRepositoryId == null) {
      return null;
    }
    return (
      repositories.find((repo) => repo.id === selectedRepositoryId) ?? null
    );
  }, [repositories, selectedRepositoryId]);

  useEffect(() => {
    if (selectedRepositoryId == null) {
      setTagLoading(false);
      setArtifactLoading(false);
      return;
    }

    const repoId = selectedRepositoryId;

    setTagLoading(true);
    setArtifactLoading(true);
    setTagError(null);
    setArtifactError(null);
    setTagSearch("");

    let isMounted = true;

    fetchRepositoryTags(repoId)
      .then((data) => {
        if (!isMounted) return;
        setTagsByRepository((prev) => ({
          ...prev,
          [repoId]: data,
        }));
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load tags.";
        setTagError(message);
        setTagsByRepository((prev) => ({
          ...prev,
          [repoId]: [],
        }));
      })
      .finally(() => {
        if (isMounted) {
          setTagLoading(false);
        }
      });

    fetchRepositoryArtifacts(repoId)
      .then((data) => {
        if (!isMounted) return;
        setArtifactsByRepository((prev) => ({
          ...prev,
          [repoId]: data,
        }));
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load artifacts.";
        setArtifactError(message);
        setArtifactsByRepository((prev) => ({
          ...prev,
          [repoId]: [],
        }));
      })
      .finally(() => {
        if (isMounted) {
          setArtifactLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRepositoryId]);

  useEffect(() => {
    if (!editMode) {
      setUpdateError(null);
    }
  }, [editMode]);

  useEffect(() => {
    setPushError(null);
    setIsPushing(false);
    setPushTagName("");
    setPushDigest("");
    setPushSize("");
    setPushMediaType(DEFAULT_MEDIA_TYPE);
  }, [selectedRepositoryId]);

  const filteredTags = useMemo(() => {
    if (!selectedRepository) {
      return [];
    }

    const tags = tagsByRepository[selectedRepository.id] ?? [];
    const query = tagSearch.trim().toLowerCase();

    return tags
      .filter((tag) => {
        if (!query) {
          return true;
        }
        return (
          tag.name.toLowerCase().includes(query) ||
          tag.artifactDigest.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedRepository, tagSearch, tagsByRepository]);

  const repositoryArtifacts = useMemo(() => {
    if (!selectedRepository) {
      return [];
    }

    return artifactsByRepository[selectedRepository.id] ?? [];
  }, [artifactsByRepository, selectedRepository]);

  const handleSelectRepository = (repositoryId: number) => {
    setSelectedRepositoryId(repositoryId);
    setEditMode(false);
    setTagError(null);
    setArtifactError(null);
    setPushError(null);
  };

  const handleCreateRepository = async (values: RepositoryFormValues) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      const payload = sanitizePayload(values);
      if (!payload.name) {
        setCreateError("Repository name is required.");
        return;
      }
      const created = await createRepository(payload);
      setRepositories((current) => [created, ...current]);
      setSelectedRepositoryId(created.id);
      setTagsByRepository((current) => ({
        ...current,
        [created.id]: [],
      }));
      setArtifactsByRepository((current) => ({
        ...current,
        [created.id]: [],
      }));
      setShowCreateModal(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create repository.";
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRepository = async (values: RepositoryFormValues) => {
    if (!selectedRepository) {
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const payload = sanitizePayload(values);
      if (!payload.name) {
        setUpdateError("Repository name is required.");
        return;
      }
      const updated = await updateRepository(selectedRepository.id, payload);
      setRepositories((current) =>
        current.map((repo) => (repo.id === updated.id ? updated : repo))
      );
      setEditMode(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update repository.";
      setUpdateError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRepository = async () => {
    if (pendingDeleteId == null) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteRepositoryApi(pendingDeleteId);
      setRepositories((current) =>
        current.filter((repo) => repo.id !== pendingDeleteId)
      );
      setTagsByRepository((current) => {
        const updated = { ...current };
        delete updated[pendingDeleteId];
        return updated;
      });

      setArtifactsByRepository((current) => {
        const updated = { ...current };
        delete updated[pendingDeleteId];
        return updated;
      });
      setPendingDeleteId(null);
      setEditMode(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete repository.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    if (!selectedRepository) {
      return;
    }

    setTagDeletePending(tagName);
    setTagError(null);

    try {
      await deleteRepositoryTag(selectedRepository.id, tagName);
      setTagsByRepository((current) => ({
        ...current,
        [selectedRepository.id]: (current[selectedRepository.id] ?? []).filter(
          (tag) => tag.name !== tagName
        ),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete tag.";
      setTagError(message);
    } finally {
      setTagDeletePending(null);
    }
  };

  const handleDockerPush = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRepository) {
      return;
    }

    const tagName = pushTagName.trim();
    const digest = pushDigest.trim();
    const sizeInput = pushSize.trim();
    const mediaTypeInput = pushMediaType.trim();

    if (!tagName) {
      setPushError("Tag name is required.");
      return;
    }

    if (!digest) {
      setPushError("Digest is required.");
      return;
    }

    let sizeValue: number | null = null;
    if (sizeInput) {
      const parsed = Number(sizeInput);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setPushError("Image size must be zero or a positive number.");
        return;
      }
      sizeValue = Math.round(parsed);
    }

    setIsPushing(true);
    setPushError(null);

    try {
      const repoId = selectedRepository.id;
      const existingArtifacts = artifactsByRepository[repoId] ?? [];
      const alreadyCreated = existingArtifacts.some(
        (artifact) => artifact.digest === digest
      );

      if (!alreadyCreated) {
        const createdArtifact = await createRepositoryArtifact(repoId, {
          digest,
          size: sizeValue,
          mediaType: mediaTypeInput.length > 0 ? mediaTypeInput : null,
        });

        setArtifactsByRepository((prev) => ({
          ...prev,
          [repoId]: [createdArtifact, ...(prev[repoId] ?? [])],
        }));
      }

      const createdTag = await createRepositoryTag(repoId, {
        name: tagName,
        digest,
      });

      setTagsByRepository((prev) => {
        const existing = prev[repoId] ?? [];
        const withoutDuplicate = existing.filter(
          (tag) => tag.name !== createdTag.name
        );
        return {
          ...prev,
          [repoId]: [createdTag, ...withoutDuplicate],
        };
      });

      setPushTagName("");
      setPushDigest("");
      setPushSize("");
      setPushMediaType(
        mediaTypeInput.length > 0 ? mediaTypeInput : DEFAULT_MEDIA_TYPE
      );
      setPushError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to push image.";
      setPushError(message);
    } finally {
      setIsPushing(false);
    }
  };

  const repositoryPendingDelete = useMemo(() => {
    if (pendingDeleteId == null) {
      return null;
    }
    return repositories.find((repo) => repo.id === pendingDeleteId) ?? null;
  }, [pendingDeleteId, repositories]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
            <Link
              href="/admin/dashboard"
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
                href="/admin/dashboard"
                className="rounded-full border border-white/30 px-4 py-2 transition hover:border-white hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/repositories"
                className="rounded-full border border-white/30 px-4 py-2 transition hover:border-white hover:text-white"
              >
                Repositories
              </Link>
              <Link
                href="/admin/explore"
                className="rounded-full border border-white/30 px-4 py-2 transition hover:border-white hover:text-white"
              >
                Explore
              </Link>
              <Link
                href="/admin/users"
                className="rounded-full border border-white/30 px-4 py-2 transition hover:border-white hover:text-white"
              >
                Users
              </Link>
              <Link
                href="/admin/analytics"
                className="rounded-full border border-white/30 px-4 py-2 transition hover:border-white hover:text-white"
              >
                Analytics
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full bg-sky-500 px-4 py-2 font-semibold uppercase tracking-wide text-sm text-white transition hover:bg-sky-400"
              >
                Log out
              </button>
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
              Manage your repositories
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300/80">
              View repositories you own, update their visibility, and manage
              tags synchronized with your container images.
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setCreateError(null);
            }}
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
                    value={visibilityFilter}
                    onChange={(event) =>
                      setVisibilityFilter(
                        event.target.value as "all" | VisibilityOption
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
                {isLoading ? (
                  <div className="p-6 text-sm text-slate-300/60">
                    Loading repositories...
                  </div>
                ) : error ? (
                  <div className="p-6 text-sm text-rose-300/80">{error}</div>
                ) : filteredRepositories.length === 0 ? (
                  <div className="p-6 text-sm text-slate-300/60">
                    No repositories match the selected filters.
                  </div>
                ) : (
                  filteredRepositories.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => handleSelectRepository(repo.id)}
                      className={classNames(
                        "w-full px-6 py-5 text-left transition hover:bg-white/5 focus:outline-none",
                        selectedRepositoryId === repo.id && "bg-white/10"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-300/80">
                            <span className="rounded-full bg-slate-900/80 px-2 py-1 text-xs font-semibold uppercase tracking-widest">
                              {repo.ownerUsername}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-semibold text-sky-300">
                              {repo.isPublic ? "Public" : "Private"}
                            </span>
                          </div>
                          <h2 className="mt-2 text-lg font-semibold text-white">
                            {repo.name}
                          </h2>
                          <p className="mt-1 text-sm text-slate-300/80">
                            {repo.description ?? "No description provided."}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          Updated {formatDate(repo.updatedAt ?? repo.createdAt)}
                        </div>
                      </div>
                    </button>
                  ))
                )}
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
                        {selectedRepository.description ??
                          "No description provided."}
                      </p>
                      <dl className="mt-4 grid gap-2 text-xs text-slate-300/70">
                        <div className="flex items-center gap-2">
                          <dt className="w-28 uppercase tracking-wide text-slate-400">
                            Visibility
                          </dt>
                          <dd className="rounded-full bg-slate-900/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-sky-200">
                            {selectedRepository.isPublic ? "public" : "private"}
                          </dd>
                        </div>
                        <div className="flex items-center gap-2">
                          <dt className="w-28 uppercase tracking-wide text-slate-400">
                            Owner
                          </dt>
                          <dd className="text-sm text-white">
                            {selectedRepository.ownerUsername}
                          </dd>
                        </div>
                        <div className="flex items-center gap-2">
                          <dt className="w-28 uppercase tracking-wide text-slate-400">
                            Created
                          </dt>
                          <dd>{formatDate(selectedRepository.createdAt)}</dd>
                        </div>
                        <div className="flex items-center gap-2">
                          <dt className="w-28 uppercase tracking-wide text-slate-400">
                            Updated
                          </dt>
                          <dd>
                            {formatDate(
                              selectedRepository.updatedAt ??
                                selectedRepository.createdAt
                            )}
                          </dd>
                        </div>
                        <div className="flex items-center gap-2">
                          <dt className="w-28 uppercase tracking-wide text-slate-400">
                            Official
                          </dt>
                          <dd>
                            {selectedRepository.isOfficial ? "Yes" : "No"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <button
                        onClick={() => setEditMode((prev) => !prev)}
                        className="rounded-full border border-white/30 px-4 py-2 font-semibold uppercase tracking-wide text-white transition hover:border-sky-400 hover:text-sky-200"
                      >
                        {editMode ? "Close" : "Edit settings"}
                      </button>
                      <button
                        onClick={() => {
                          setPendingDeleteId(selectedRepository.id);
                          setDeleteError(null);
                        }}
                        className="rounded-full border border-rose-500/40 px-4 py-2 font-semibold uppercase tracking-wide text-rose-300 transition hover:border-rose-400 hover:text-rose-200"
                      >
                        Delete repository
                      </button>
                    </div>
                  </div>

                  {editMode ? (
                    <RepositoryEditForm
                      repository={selectedRepository}
                      onSubmit={handleUpdateRepository}
                      isSubmitting={isUpdating}
                      error={updateError}
                    />
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                      Docker push
                    </p>
                    <h4 className="text-lg font-semibold text-white">
                      Simulate a docker push
                    </h4>
                    <p className="text-xs text-slate-300/70">
                      Provide manifest information to create an artifact and tag
                      as if you pushed an image with <code>docker push</code>.
                    </p>
                  </div>

                  <form
                    onSubmit={handleDockerPush}
                    className="mt-6 space-y-4 text-xs"
                  >
                    <div className="space-y-2">
                      <label className="uppercase tracking-wide text-slate-400">
                        Tag name
                      </label>
                      <input
                        value={pushTagName}
                        onChange={(event) => setPushTagName(event.target.value)}
                        required
                        placeholder="latest"
                        className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="uppercase tracking-wide text-slate-400">
                        Digest
                      </label>
                      <input
                        value={pushDigest}
                        onChange={(event) => setPushDigest(event.target.value)}
                        required
                        placeholder="sha256:..."
                        className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm font-mono outline-none transition focus:border-sky-400"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="uppercase tracking-wide text-slate-400">
                          Image size (bytes)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={pushSize}
                          onChange={(event) => setPushSize(event.target.value)}
                          placeholder="e.g. 458752"
                          className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="uppercase tracking-wide text-slate-400">
                          Media type
                        </label>
                        <input
                          value={pushMediaType}
                          onChange={(event) =>
                            setPushMediaType(event.target.value)
                          }
                          className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
                        />
                      </div>
                    </div>
                    {pushError ? (
                      <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-[11px] text-rose-200">
                        {pushError}
                      </div>
                    ) : null}
                    <button
                      type="submit"
                      disabled={isPushing}
                      className="w-full rounded-full bg-sky-500 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPushing ? "Pushing..." : "Push image"}
                    </button>
                  </form>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                      Artifacts
                    </p>
                    <h4 className="text-lg font-semibold text-white">
                      {artifactLoading
                        ? "Loading artifacts..."
                        : `${repositoryArtifacts.length} artifacts`}
                    </h4>
                    <p className="text-xs text-slate-300/70">
                      Artifacts represent image manifests associated with this
                      repository. They are populated whenever you simulate a
                      push.
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    {artifactError ? (
                      <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-xs text-rose-200">
                        {artifactError}
                      </div>
                    ) : null}
                    {!artifactLoading && repositoryArtifacts.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-4 text-xs text-slate-300/70">
                        No artifacts have been pushed yet.
                      </div>
                    ) : null}
                    {artifactLoading ? (
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-4 text-xs text-slate-300/60">
                        Fetching artifacts...
                      </div>
                    ) : (
                      repositoryArtifacts.map((artifact) => (
                        <div
                          key={artifact.id ?? artifact.digest}
                          className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs text-slate-200"
                        >
                          <p className="font-mono text-sm text-white">
                            {artifact.digest}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-wide text-slate-300/70">
                            <span className="rounded-full border border-white/10 bg-slate-900/60 px-2 py-1">
                              Size: {formatBytes(artifact.size)}
                            </span>
                            <span className="rounded-full border border-white/10 bg-slate-900/60 px-2 py-1">
                              Media: {artifact.mediaType ?? "unknown"}
                            </span>
                            <span className="rounded-full border border-white/10 bg-slate-900/60 px-2 py-1">
                              Pushed {formatDateTime(artifact.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                        Tags
                      </p>
                      <h4 className="mt-1 text-lg font-semibold text-white">
                        {tagLoading
                          ? "Loading tags..."
                          : `${filteredTags.length} tags`}
                      </h4>
                      <p className="mt-2 text-xs text-slate-300/70">
                        Tags are created via <code>docker push</code>. Remove
                        unused tags to keep things tidy.
                      </p>
                    </div>
                    <input
                      value={tagSearch}
                      onChange={(event) => setTagSearch(event.target.value)}
                      placeholder="Search tags"
                      className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-xs outline-none transition focus:border-sky-400"
                    />
                  </div>

                  <div className="mt-6 space-y-3">
                    {tagError ? (
                      <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-xs text-rose-200">
                        {tagError}
                      </div>
                    ) : null}
                    {!tagLoading && filteredTags.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-4 text-xs text-slate-300/70">
                        No tags found for this repository.
                      </div>
                    ) : null}
                    {tagLoading ? (
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-4 text-xs text-slate-300/60">
                        Fetching tags...
                      </div>
                    ) : (
                      filteredTags.map((tag) => (
                        <div
                          key={tag.id ?? tag.name}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs text-slate-200"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {tag.name}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-slate-400">
                              {tag.artifactDigest}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteTag(tag.name)}
                            disabled={tagDeletePending === tag.name}
                            className="rounded-full border border-rose-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-400 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {tagDeletePending === tag.name
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-sm text-slate-300/70 backdrop-blur">
                {isLoading
                  ? "Loading repository details..."
                  : "Select a repository to view its details."}
              </div>
            )}
          </aside>
        </section>
      </div>

      {showCreateModal ? (
        <CreateRepositoryModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRepository}
          isSubmitting={isCreating}
          error={createError}
        />
      ) : null}

      {pendingDeleteId != null && repositoryPendingDelete ? (
        <DeleteRepositoryPrompt
          repositoryName={repositoryPendingDelete.name}
          onCancel={() => {
            if (!isDeleting) {
              setPendingDeleteId(null);
            }
          }}
          onConfirm={handleDeleteRepository}
          isDeleting={isDeleting}
          error={deleteError}
        />
      ) : null}
    </main>
  );
}

interface RepositoryEditFormProps {
  repository: UserRepository;
  onSubmit: (values: RepositoryFormValues) => Promise<void> | void;
  isSubmitting: boolean;
  error: string | null;
}

function RepositoryEditForm({
  repository,
  onSubmit,
  isSubmitting,
  error,
}: RepositoryEditFormProps) {
  const [name, setName] = useState(repository.name);
  const [description, setDescription] = useState(repository.description ?? "");
  const [visibility, setVisibility] = useState<VisibilityOption>(
    repository.isPublic ? "public" : "private"
  );

  const [isOfficial, setIsOfficial] = useState<boolean>(repository.isOfficial);

  useEffect(() => {
    setName(repository.name);
    setDescription(repository.description ?? "");
    setVisibility(repository.isPublic ? "public" : "private");
    setIsOfficial(repository.isOfficial);
  }, [repository]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onSubmit({ name, description, visibility, isOfficial });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-xs">
      <div className="space-y-2">
        <label className="uppercase tracking-wide text-slate-400">
          Repository name
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
          placeholder="backend-service"
        />
      </div>
      <div className="space-y-2">
        <label className="uppercase tracking-wide text-slate-400">
          Description
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
          placeholder="Describe your repository"
        />
      </div>
      <div className="space-y-2">
        <label className="uppercase tracking-wide text-slate-400">
          Visibility
        </label>
        <div className="flex gap-2">
          {(["public", "private"] as VisibilityOption[]).map((option) => (
            <label
              key={option}
              className={classNames(
                "flex flex-1 cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-[11px] font-semibold uppercase tracking-wide transition",
                visibility === option
                  ? "border-sky-400 bg-sky-500/10 text-sky-200"
                  : "border-white/10 bg-slate-950/40 text-slate-200 hover:border-sky-400/40"
              )}
            >
              <span>{option === "public" ? "Public" : "Private"}</span>
              <input
                type="radio"
                name="visibility"
                value={option}
                checked={visibility === option}
                onChange={() => setVisibility(option)}
                className="hidden"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-200">
        <input
          id="edit-is-official"
          type="checkbox"
          checked={isOfficial}
          onChange={(event) => setIsOfficial(event.target.checked)}
          className="h-4 w-4 rounded border border-white/20 bg-slate-900 text-sky-400 focus:ring-0"
        />
        <label htmlFor="edit-is-official" className="select-none">
          Is official?
        </label>
      </div>
      {error ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-[11px] text-rose-200">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

interface CreateRepositoryModalProps {
  onClose: () => void;
  onSubmit: (values: RepositoryFormValues) => Promise<void> | void;
  isSubmitting: boolean;
  error: string | null;
}

function CreateRepositoryModal({
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: CreateRepositoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<VisibilityOption>("public");
  const [isOfficial, setIsOfficial] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onSubmit({ name, description, visibility, isOfficial });
    } catch (err) {
      console.error(err);
    }
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
        <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-xs">
          <div className="space-y-2">
            <label className="uppercase tracking-wide text-slate-400">
              Repository name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
              placeholder="backend-service"
            />
          </div>
          <div className="space-y-2">
            <label className="uppercase tracking-wide text-slate-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
              placeholder="Describe your repository"
            />
          </div>
          <div className="space-y-2">
            <label className="uppercase tracking-wide text-slate-400">
              Visibility
            </label>
            <div className="flex gap-2">
              {(["public", "private"] as VisibilityOption[]).map((option) => (
                <label
                  key={option}
                  className={classNames(
                    "flex flex-1 cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-[11px] font-semibold uppercase tracking-wide transition",
                    visibility === option
                      ? "border-sky-400 bg-sky-500/10 text-sky-200"
                      : "border-white/10 bg-slate-950/40 text-slate-200 hover:border-sky-400/40"
                  )}
                >
                  <span>{option === "public" ? "Public" : "Private"}</span>
                  <input
                    type="radio"
                    name="visibility"
                    value={option}
                    checked={visibility === option}
                    onChange={() => setVisibility(option)}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-200">
            <input
              id="create-is-official"
              type="checkbox"
              checked={isOfficial}
              onChange={(event) => setIsOfficial(event.target.checked)}
              className="h-4 w-4 rounded border border-white/20 bg-slate-900 text-sky-400 focus:ring-0"
            />
            <label htmlFor="create-is-official" className="select-none">
              Is official?
            </label>
          </div>
          {error ? (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-[11px] text-rose-200">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isSubmitting ? "Creating..." : "Create repository"}
          </button>
        </form>
      </div>
    </div>
  );
}

interface DeleteRepositoryPromptProps {
  repositoryName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting: boolean;
  error: string | null;
}

function DeleteRepositoryPrompt({
  repositoryName,
  onCancel,
  onConfirm,
  isDeleting,
  error,
}: DeleteRepositoryPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-slate-950/90 p-8 text-center shadow-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-rose-300">
            Confirm deletion
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Delete “{repositoryName}”?
          </h2>
          <p className="mt-3 text-sm text-slate-300/80">
            This action permanently removes the repository and all of its tags.
            You cannot undo this operation.
          </p>
        </div>
        {error ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
            {error}
          </div>
        ) : null}
        <div className="flex flex-col gap-3 text-xs font-semibold uppercase tracking-wide text-white md:flex-row">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-full border border-white/20 px-4 py-3 transition hover:border-white/40 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              Promise.resolve(onConfirm()).catch((err) => console.error(err));
            }}
            disabled={isDeleting}
            className="flex-1 rounded-full border border-rose-500/40 bg-rose-500/20 px-4 py-3 text-rose-100 transition hover:border-rose-400 hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete repository"}
          </button>
        </div>
      </div>
    </div>
  );
}
