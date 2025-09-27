"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type BadgeOption = {
  id: string;
  label: string;
  description: string;
};

type UserRecord = {
  id: number;
  name: string;
  username: string;
  email: string;
  repositories: number;
  lastActive: string;
  badges: string[];
};

type EditFormState = {
  name: string;
  username: string;
  email: string;
  repositories: string;
  lastActive: string;
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

const navigationLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/repositories", label: "Repositories" },
  { href: "/admin/users", label: "User administration" },
  { href: "/profile", label: "Profile" },
];

const quickLinks = [
  { href: "/explore", label: "Browse repositories" },
  { href: "/repositories", label: "Manage repositories" },
  { href: "/profile", label: "View profile" },
];

const initialUsers: UserRecord[] = [
  {
    id: 1,
    name: "Anna Peterson",
    username: "annap",
    email: "anna@example.com",
    repositories: 12,
    lastActive: "2 hours ago",
    badges: ["Verified Publisher"],
  },
  {
    id: 2,
    name: "Marcus Johnson",
    username: "marcusj",
    email: "marcus@example.com",
    repositories: 6,
    lastActive: "Yesterday",
    badges: ["Sponsored OSS"],
  },
  {
    id: 3,
    name: "Isabelle Nolan",
    username: "isabelle",
    email: "isabelle@example.com",
    repositories: 3,
    lastActive: "3 days ago",
    badges: [],
  },
];

const emptyEditForm: EditFormState = {
  name: "",
  username: "",
  email: "",
  repositories: "",
  lastActive: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedUserId, setFocusedUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [badgeSelections, setBadgeSelections] = useState<
    Record<number, string[]>
  >(() => {
    const initialSelection: Record<number, string[]> = {};
    initialUsers.forEach((user) => {
      initialSelection[user.id] = [...user.badges];
    });
    return initialSelection;
  });
  const [status, setStatus] = useState<StatusMessage>(null);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
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

  const focusedUser = focusedUserId
    ? users.find((user) => user.id === focusedUserId) ?? null
    : null;

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

  const handleSaveBadges = (
    event: FormEvent<HTMLFormElement>,
    userId: number
  ) => {
    event.preventDefault();

    const nextBadges = badgeSelections[userId] ?? [];
    const targetUser = users.find((user) => user.id === userId);

    setUsers((previous) =>
      previous.map((user) =>
        user.id === userId
          ? {
              ...user,
              badges: [...nextBadges],
            }
          : user
      )
    );

    if (targetUser) {
      setStatus({
        kind: "success",
        text: `Updated badges for ${targetUser.name}.`,
      });
    }
  };

  const handleEditClick = (user: UserRecord) => {
    setFocusedUserId(user.id);
    setEditForm({
      name: user.name,
      username: user.username,
      email: user.email,
      repositories: String(user.repositories),
      lastActive: user.lastActive,
    });
    setStatus(null);
  };

  const handleEditFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (focusedUserId === null) {
      setStatus({
        kind: "error",
        text: "Select a user to edit from the list.",
      });
      return;
    }

    const repositoriesValue = Number.parseInt(editForm.repositories, 10);

    if (Number.isNaN(repositoriesValue) || repositoriesValue < 0) {
      setStatus({
        kind: "error",
        text: "Repositories must be a non-negative number.",
      });
      return;
    }

    setUsers((previous) =>
      previous.map((user) =>
        user.id === focusedUserId
          ? {
              ...user,
              name: editForm.name.trim() || user.name,
              username: editForm.username.trim() || user.username,
              email: editForm.email.trim() || user.email,
              repositories: repositoriesValue,
              lastActive: editForm.lastActive.trim() || user.lastActive,
            }
          : user
      )
    );

    const updatedUser = users.find((user) => user.id === focusedUserId);

    if (updatedUser) {
      setStatus({
        kind: "success",
        text: `Saved profile changes for ${editForm.name || updatedUser.name}.`,
      });
    }
  };

  const handleDeleteUser = (userId: number) => {
    const removedUser = users.find((user) => user.id === userId);

    setUsers((previous) => previous.filter((user) => user.id !== userId));
    setBadgeSelections((previous) => {
      const next = { ...previous };
      delete next[userId];
      return next;
    });

    if (focusedUserId === userId) {
      setFocusedUserId(null);
      setEditForm(emptyEditForm);
    }

    if (removedUser) {
      setStatus({
        kind: "success",
        text: `Deleted ${removedUser.name} from the directory.`,
      });
    }
  };

  const handleFocusBadges = (userId: number) => {
    setFocusedUserId(userId);
    setStatus(null);
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
                Administrators can search regular users, edit their profile
                details, and assign badges that appear in the Explore section
                and on repository details pages.
              </p>
            </div>
            <button className="self-start rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400">
              + New admin
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
        </section>

        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {filteredUsers.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-center text-sm text-slate-400">
                No users match “{searchTerm}”. Try a different search term.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const selection = badgeSelections[user.id] ?? [];

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
                      <div>
                        <h2 className="text-xl font-semibold text-white">
                          {user.name}
                        </h2>
                        <p className="text-sm text-slate-400">
                          @{user.username} · {user.email}
                        </p>
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
                          className="rounded-full border border-rose-500/40 px-4 py-2 font-semibold text-rose-200 transition hover:border-rose-400 hover:text-rose-100"
                        >
                          Delete
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
                          {user.repositories}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Last active
                        </dt>
                        <dd className="text-lg font-semibold text-white">
                          {user.lastActive}
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
                          className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                        >
                          Save badge changes
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
                Updates are saved instantly for the current session.
              </p>
              <form className="mt-5 space-y-4" onSubmit={handleEditSubmit}>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="edit-name"
                  >
                    Name
                  </label>
                  <input
                    id="edit-name"
                    name="name"
                    value={editForm.name}
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
                    type="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    placeholder="Email address"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="edit-repositories"
                  >
                    Repositories
                  </label>
                  <input
                    id="edit-repositories"
                    name="repositories"
                    value={editForm.repositories}
                    onChange={handleEditFormChange}
                    placeholder="Repository count"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="edit-last-active"
                  >
                    Last active
                  </label>
                  <input
                    id="edit-last-active"
                    name="lastActive"
                    value={editForm.lastActive}
                    onChange={handleEditFormChange}
                    placeholder="e.g. 2 hours ago"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                >
                  Save changes
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
                      {focusedUser.name}
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
                          text: `Prepared ${badge.label} for ${focusedUser.name}. Remember to save.`,
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
