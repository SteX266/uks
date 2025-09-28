"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  type AdminUser,
  type CreateAdminUserPayload,
  type UpdateAdminUserPayload,
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from "../../lib/api";

type BadgeOption = {
  id: string;
  label: string;
  description: string;
};

type EditFormState = {
  displayName: string;
  username: string;
  email: string;
  bio: string;
  active: boolean;
};

type NewAdminFormState = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  bio: string;
};

type StatusMessage = {
  kind: "success" | "error";
  text: string;
} | null;

const badgeOptions: BadgeOption[] = [
  {
    id: "verified",
    label: "Verified Publisher",
    description:
      "Indicates the user manages verified organization accounts and publishes validated repositories.",
  },
  {
    id: "sponsored",
    label: "Sponsored OSS",
    description:
      "Highlights authors whose open-source projects receive sponsorship support.",
  },
];

const quickLinks = [
  { href: "/explore", label: "Browse repositories" },
  { href: "/repositories", label: "Manage repositories" },
  { href: "/profile", label: "View profile" },
];

const emptyEditForm: EditFormState = {
  displayName: "",
  username: "",
  email: "",
  bio: "",
  active: true,
};

const emptyNewAdminForm: NewAdminFormState = {
  displayName: "",
  username: "",
  email: "",
  password: "",
  bio: "",
};

function formatRelativeTime(timestamp: string | null) {
  if (!timestamp) {
    return "No recent activity";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "No recent activity";
  }

  const diff = Date.now() - date.getTime();
  const isPast = diff >= 0;
  const absSeconds = Math.floor(Math.abs(diff) / 1000);

  if (absSeconds < 5) {
    return "Just now";
  }

  let value = absSeconds;
  let unit = "second";

  if (value >= 60) {
    value = Math.floor(value / 60);
    unit = "minute";
    if (value >= 60) {
      value = Math.floor(value / 60);
      unit = "hour";
      if (value >= 24) {
        value = Math.floor(value / 24);
        unit = "day";
        if (value >= 30) {
          value = Math.floor(value / 30);
          unit = "month";
          if (value >= 12) {
            value = Math.floor(value / 12);
            unit = "year";
          }
        }
      }
    }
  }

  const suffix = isPast ? "ago" : "from now";
  const plural = value === 1 ? unit : `${unit}s`;
  return `${value} ${plural} ${suffix}`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedUserId, setFocusedUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [badgeSelections, setBadgeSelections] = useState<
    Record<number, string[]>
  >({});
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isSavingBadgesFor, setIsSavingBadgesFor] = useState<number | null>(
    null
  );
  const [isDeletingUserId, setIsDeletingUserId] = useState<number | null>(null);
  const [showNewAdminForm, setShowNewAdminForm] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [newAdminForm, setNewAdminForm] =
    useState<NewAdminFormState>(emptyNewAdminForm);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAdminUsers();
        setUsers(data);
        setStatus(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load users. Please try again.";
        setStatus({ kind: "error", text: message });
      } finally {
        setIsLoading(false);
      }
    };

    void loadUsers();
  }, []);

  useEffect(() => {
    setBadgeSelections(() => {
      const next: Record<number, string[]> = {};
      users.forEach((user) => {
        next[user.id] = [...user.badges];
      });
      return next;
    });
  }, [users]);

  const focusedUser = useMemo(() => {
    if (focusedUserId === null) {
      return null;
    }

    return users.find((user) => user.id === focusedUserId) ?? null;
  }, [focusedUserId, users]);

  useEffect(() => {
    if (focusedUser) {
      setEditForm({
        displayName: focusedUser.displayName ?? "",
        username: focusedUser.username,
        email: focusedUser.email,
        bio: focusedUser.bio ?? "",
        active: focusedUser.active,
      });
    } else {
      setEditForm(emptyEditForm);
    }
  }, [focusedUser]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const name = (user.displayName ?? "").toLowerCase();
      return (
        name.includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [users, searchTerm]);

  const totals = useMemo(() => {
    const verifiedCount = users.filter((user) =>
      user.badges.includes("Verified Publisher")
    ).length;
    const sponsoredCount = users.filter((user) =>
      user.badges.includes("Sponsored OSS")
    ).length;

    return {
      totalUsers: users.length,
      verifiedCount,
      sponsoredCount,
    };
  }, [users]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleBadgeSelection = (userId: number, badgeLabel: string) => {
    setBadgeSelections((previous) => {
      const current = new Set(previous[userId] ?? []);

      if (current.has(badgeLabel)) {
        current.delete(badgeLabel);
      } else {
        current.add(badgeLabel);
      }

      return {
        ...previous,
        [userId]: Array.from(current),
      };
    });
  };

  const handleSaveBadges = async (
    event: FormEvent<HTMLFormElement>,
    userId: number
  ) => {
    event.preventDefault();
    const badges = badgeSelections[userId] ?? [];

    try {
      setIsSavingBadgesFor(userId);
      const updated = await updateAdminUser(userId, { badges });
      setUsers((previous) =>
        previous.map((user) => (user.id === updated.id ? updated : user))
      );
      setStatus({
        kind: "success",
        text: `Updated badges for ${updated.displayName ?? updated.username}.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update badges right now.";
      setStatus({ kind: "error", text: message });
    } finally {
      setIsSavingBadgesFor(null);
    }
  };

  const handleEditClick = (user: AdminUser) => {
    setFocusedUserId(user.id);
    setStatus(null);
  };

  const handleEditFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setEditForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleEditActiveChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value === "active";
    setEditForm((previous) => ({ ...previous, active: nextValue }));
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (focusedUserId === null) {
      setStatus({
        kind: "error",
        text: "Select a user to edit from the list.",
      });
      return;
    }

    const targetUser = users.find((user) => user.id === focusedUserId);
    if (!targetUser) {
      setStatus({ kind: "error", text: "User could not be found." });
      return;
    }

    const payload: UpdateAdminUserPayload = {
      displayName: editForm.displayName.trim() || undefined,
      username: editForm.username.trim() || undefined,
      email: editForm.email.trim() || undefined,
      bio: editForm.bio.trim(),
      active: editForm.active,
    };

    if (!payload.displayName && targetUser.displayName) {
      payload.displayName = targetUser.displayName;
    }

    if (!payload.username) {
      payload.username = targetUser.username;
    }

    if (!payload.email) {
      payload.email = targetUser.email;
    }

    try {
      setIsUpdatingUser(true);
      const updated = await updateAdminUser(focusedUserId, payload);
      setUsers((previous) =>
        previous.map((user) => (user.id === updated.id ? updated : user))
      );
      setStatus({
        kind: "success",
        text: `Saved profile changes for ${
          updated.displayName ?? updated.username
        }.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save profile changes.";
      setStatus({ kind: "error", text: message });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const target = users.find((user) => user.id === userId);
    if (!target) {
      return;
    }

    try {
      setIsDeletingUserId(userId);
      await deleteAdminUser(userId);
      setUsers((previous) => previous.filter((user) => user.id !== userId));
      setBadgeSelections((previous) => {
        const next = { ...previous };
        delete next[userId];
        return next;
      });

      if (focusedUserId === userId) {
        setFocusedUserId(null);
      }

      setStatus({
        kind: "success",
        text: `Deleted ${
          target.displayName ?? target.username
        } from the directory.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete the selected user.";
      setStatus({ kind: "error", text: message });
    } finally {
      setIsDeletingUserId(null);
    }
  };

  const handleFocusBadges = (userId: number) => {
    setFocusedUserId(userId);
    setStatus(null);
  };

  const handleNewAdminFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setNewAdminForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: CreateAdminUserPayload = {
      displayName: newAdminForm.displayName.trim(),
      username: newAdminForm.username.trim(),
      email: newAdminForm.email.trim(),
      password: newAdminForm.password,
      bio: newAdminForm.bio.trim() || undefined,
    };

    try {
      setIsCreatingAdmin(true);
      const created = await createAdminUser(payload);
      setUsers((previous) =>
        [...previous, created].sort((a, b) =>
          a.username.localeCompare(b.username, undefined, {
            sensitivity: "base",
          })
        )
      );
      setNewAdminForm(emptyNewAdminForm);
      setShowNewAdminForm(false);
      setFocusedUserId(created.id);
      setStatus({
        kind: "success",
        text: `Created admin account for ${
          created.displayName ?? created.username
        }.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create the admin account.";
      setStatus({ kind: "error", text: message });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
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
                    User Administration
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
                <Link
                  href="/admin/analytics"
                  className="rounded-full border border-white/40 px-4 py-2 transition hover:border-white hover:bg-white/10"
                >
                  Analytics
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
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
                Admin Console
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                User Administration
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300/80">
                Administrators can search registered users, edit their profile
                details, manage account status, and assign badges that appear in
                the Explore section and on repository details pages.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowNewAdminForm((previous) => !previous);
                setStatus(null);
              }}
              className="self-start rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400"
            >
              {showNewAdminForm ? "Close form" : "+ New admin"}
            </button>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <label className="sr-only" htmlFor="user-search">
                Search users
              </label>
              <input
                id="user-search"
                type="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name, username, or email"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Showing {filteredUsers.length} of {users.length} users
            </span>
          </div>

          <div className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-3">
            <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">
                Total users
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {totals.totalUsers}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                Verified Publisher
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {totals.verifiedCount}
              </p>
            </div>
            <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-200">
                Sponsored OSS
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {totals.sponsoredCount}
              </p>
            </div>
          </div>

          {showNewAdminForm && (
            <form
              className="mt-8 space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-6"
              onSubmit={handleCreateAdmin}
            >
              <h2 className="text-lg font-semibold text-white">
                Create admin account
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="new-displayName"
                  >
                    Display name
                  </label>
                  <input
                    id="new-displayName"
                    name="displayName"
                    value={newAdminForm.displayName}
                    onChange={handleNewAdminFormChange}
                    placeholder="Full name"
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="new-username"
                  >
                    Username
                  </label>
                  <input
                    id="new-username"
                    name="username"
                    value={newAdminForm.username}
                    onChange={handleNewAdminFormChange}
                    placeholder="Unique username"
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="new-email"
                  >
                    Email
                  </label>
                  <input
                    id="new-email"
                    name="email"
                    type="email"
                    value={newAdminForm.email}
                    onChange={handleNewAdminFormChange}
                    placeholder="name@example.com"
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="new-password"
                  >
                    Temporary password
                  </label>
                  <input
                    id="new-password"
                    name="password"
                    type="password"
                    value={newAdminForm.password}
                    onChange={handleNewAdminFormChange}
                    placeholder="Secure password"
                    required
                    minLength={8}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label
                  className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  htmlFor="new-bio"
                >
                  Bio (optional)
                </label>
                <textarea
                  id="new-bio"
                  name="bio"
                  value={newAdminForm.bio}
                  onChange={handleNewAdminFormChange}
                  placeholder="Short description of the admin"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingAdmin ? "Creating admin..." : "Create admin"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAdminForm(false);
                    setNewAdminForm(emptyNewAdminForm);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {isLoading ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-center text-sm text-slate-400">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-center text-sm text-slate-400">
                No users match “{searchTerm}”. Try a different search term.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const selection = badgeSelections[user.id] ?? [];
                const lastActive = formatRelativeTime(
                  user.updatedAt ?? user.createdAt
                );

                return (
                  <article
                    key={user.id}
                    className={`rounded-3xl border bg-slate-900/80 p-6 shadow-xl shadow-black/30 backdrop-blur transition hover:border-indigo-500/40 hover:shadow-2xl ${
                      focusedUserId === user.id
                        ? "border-indigo-500/50"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-white">
                          {user.displayName ?? user.username}
                        </h2>
                        <p className="text-sm text-slate-400">
                          @{user.username} · {user.email}
                        </p>
                        {user.roles.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-indigo-200/80">
                            {user.roles.map((role) => (
                              <span
                                key={role}
                                className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-[0.65rem] font-semibold text-indigo-200"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Link
                          href={`/profile?user=${user.username}`}
                          className="rounded-full border border-indigo-400/40 px-4 py-2 font-semibold text-indigo-300 transition hover:border-indigo-400 hover:text-white"
                        >
                          View profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleEditClick(user)}
                          className="rounded-full border border-slate-700/70 px-4 py-2 font-semibold text-slate-200 transition hover:border-indigo-400 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isDeletingUserId === user.id}
                          className="rounded-full border border-rose-500/40 px-4 py-2 font-semibold text-rose-200 transition hover:border-rose-400 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeletingUserId === user.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFocusBadges(user.id)}
                          className="rounded-full border border-emerald-500/30 px-4 py-2 font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                        >
                          Manage badges
                        </button>
                      </div>
                    </div>

                    <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-300 md:grid-cols-4">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Repositories
                        </dt>
                        <dd className="text-lg font-semibold text-white">
                          {user.repositoryCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Last active
                        </dt>
                        <dd className="text-lg font-semibold text-white">
                          {lastActive}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Status
                        </dt>
                        <dd className="text-lg font-semibold text-white">
                          {user.active ? "Active" : "Suspended"}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Current badges
                        </dt>
                        <dd className="mt-2 flex flex-wrap gap-2">
                          {user.badges.length === 0 ? (
                            <span className="text-xs text-slate-500">
                              No badges assigned yet.
                            </span>
                          ) : (
                            user.badges.map((badge) => (
                              <span
                                key={badge}
                                className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200"
                              >
                                {badge}
                              </span>
                            ))
                          )}
                        </dd>
                      </div>
                    </dl>

                    <form
                      className="mt-6 space-y-4"
                      onSubmit={(event) => handleSaveBadges(event, user.id)}
                    >
                      <fieldset className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 md:grid-cols-2">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Assign badges
                        </legend>
                        {badgeOptions.map((badge) => {
                          const isChecked = selection.includes(badge.label);

                          return (
                            <label
                              key={badge.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                isChecked
                                  ? "border-indigo-500/50 bg-indigo-500/10"
                                  : "border-slate-800 bg-transparent hover:border-indigo-500/30"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-400"
                                checked={isChecked}
                                onChange={() =>
                                  handleBadgeSelection(user.id, badge.label)
                                }
                              />
                              <span>
                                <span className="block text-sm font-semibold text-white">
                                  {badge.label}
                                </span>
                                <span className="mt-1 block text-xs text-slate-400">
                                  {badge.description}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </fieldset>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={isSavingBadgesFor === user.id}
                          className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSavingBadgesFor === user.id
                            ? "Saving badges..."
                            : "Save badge changes"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setBadgeSelections((previous) => ({
                              ...previous,
                              [user.id]: [...user.badges],
                            }))
                          }
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                        >
                          Reset
                        </button>
                      </div>
                    </form>
                  </article>
                );
              })
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/30 backdrop-blur">
              <h3 className="text-lg font-semibold text-white">
                Edit selected user
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Choose a user from the list to edit their profile information.
                Updates are saved immediately after submission.
              </p>
              <form className="mt-5 space-y-4" onSubmit={handleEditSubmit}>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="edit-displayName"
                  >
                    Display name
                  </label>
                  <input
                    id="edit-displayName"
                    name="displayName"
                    value={editForm.displayName}
                    onChange={handleEditFormChange}
                    placeholder="Full name"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="edit-username"
                  >
                    Username
                  </label>
                  <input
                    id="edit-username"
                    name="username"
                    value={editForm.username}
                    onChange={handleEditFormChange}
                    placeholder="Username"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="edit-email"
                  >
                    Email
                  </label>
                  <input
                    id="edit-email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    placeholder="Email"
                    type="email"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="edit-bio"
                  >
                    Bio
                  </label>
                  <textarea
                    id="edit-bio"
                    name="bio"
                    value={editForm.bio}
                    onChange={handleEditFormChange}
                    placeholder="Short bio"
                    rows={3}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="edit-status"
                  >
                    Account status
                  </label>
                  <select
                    id="edit-status"
                    value={editForm.active ? "active" : "suspended"}
                    onChange={handleEditActiveChange}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={focusedUserId === null || isUpdatingUser}
                  className="w-full rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingUser ? "Saving changes..." : "Save changes"}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/30 backdrop-blur">
              <h3 className="text-lg font-semibold text-white">
                Badge quick actions
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                {focusedUser ? (
                  <>
                    Applying a quick action will update{" "}
                    <span className="font-semibold text-white">
                      {focusedUser.displayName ?? focusedUser.username}
                    </span>
                    .
                  </>
                ) : (
                  "Choose “Manage badges” on a user card to enable quick assignments."
                )}
              </p>
              <ul className="mt-5 space-y-3">
                {badgeOptions.map((badge) => (
                  <li key={badge.id}>
                    <button
                      type="button"
                      disabled={!focusedUser}
                      onClick={() => {
                        if (!focusedUser) return;

                        setBadgeSelections((previous) => ({
                          ...previous,
                          [focusedUser.id]: Array.from(
                            new Set([
                              ...(previous[focusedUser.id] ?? []),
                              badge.label,
                            ])
                          ),
                        }));
                        setStatus({
                          kind: "success",
                          text: `Prepared ${badge.label} for ${
                            focusedUser.displayName ?? focusedUser.username
                          }. Remember to save.`,
                        });
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        focusedUser
                          ? "border-slate-800 bg-slate-950/60 text-slate-200 hover:border-indigo-500/40 hover:text-white"
                          : "cursor-not-allowed border-slate-900 bg-slate-950/40 text-slate-600"
                      }`}
                    >
                      <span className="block text-base font-semibold text-white">
                        {badge.label}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {badge.description}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/30 backdrop-blur">
              <h3 className="text-lg font-semibold text-white">Quick links</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="transition hover:text-white"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
