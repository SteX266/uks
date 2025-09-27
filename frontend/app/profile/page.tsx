"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Badge = {
  label: string;
  description: string;
};

type Repository = {
  name: string;
  description: string;
  stars: number;
  updated: string;
};

type ActivityItem = {
  title: string;
  time: string;
  detail: string;
};

type ProfileState = {
  name: string;
  username: string;
  email: string;
  memberSince: string;
  repositoriesPublic: number;
  repositoriesPrivate: number;
  lastActive: string;
  avatar: string | null;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type StatusMessage = {
  kind: "success" | "error";
  text: string;
} | null;

const badges: Badge[] = [
  {
    label: "Verified Publisher",
    description: "Publishes repositories under verified organizations.",
  },
  {
    label: "Sponsored OSS",
    description: "Maintains open-source projects with sponsorship backing.",
  },
];

const repositories: Repository[] = [
  {
    name: "uks-platform",
    description:
      "Platform for managing repositories and tracking badge visibility.",
    stars: 128,
    updated: "Updated 2 days ago",
  },
  {
    name: "analytics-dashboard",
    description: "Real-time analytics dashboard for OSS project metrics.",
    stars: 86,
    updated: "Updated 5 days ago",
  },
  {
    name: "design-system",
    description:
      "Reusable UI components aligned with the product design language.",
    stars: 54,
    updated: "Updated 1 week ago",
  },
];

const activity: ActivityItem[] = [
  {
    title: "Awarded Verified Publisher",
    time: "3 days ago",
    detail:
      "An administrator confirmed all published repositories are verified.",
  },
  {
    title: "New repository: analytics-dashboard",
    time: "5 days ago",
    detail: "Created a metrics repository and marked it as Sponsored OSS.",
  },
  {
    title: "Merged design system updates",
    time: "1 week ago",
    detail:
      "Integrated the latest design system components after admin review.",
  },
];

const navigationLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/repositories", label: "Repositories" },
  { href: "/admin/users", label: "User administration" },
];

const quickLinks = [
  { href: "/explore", label: "Browse repositories" },
  { href: "/admin/users", label: "Manage users" },
  { href: "/repositories", label: "Create repository" },
];

const initialProfile: ProfileState = {
  name: "Anna Peterson",
  username: "annap",
  email: "anna@example.com",
  memberSince: "February 2021",
  repositoriesPublic: 12,
  repositoriesPrivate: 5,
  lastActive: "2 hours ago",
  avatar: null,
};

const emptyPasswordForm: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: profile.name,
    email: profile.email,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar
  );
  const [profileStatus, setProfileStatus] = useState<StatusMessage>(null);
  const [passwordForm, setPasswordForm] =
    useState<PasswordFormState>(emptyPasswordForm);
  const [passwordStatus, setPasswordStatus] = useState<StatusMessage>(null);

  const initials = useMemo(() => {
    const parts = profile.name.trim().split(" ");
    if (parts.length === 0) {
      return "";
    }

    const [first, second] = parts;
    return (first?.[0] ?? "") + (second?.[0] ?? first?.[1] ?? "");
  }, [profile.name]);

  const handleStartEditing = () => {
    setProfileForm({ name: profile.name, email: profile.email });
    setAvatarPreview(profile.avatar);
    setProfileStatus(null);
    setIsEditingProfile(true);
  };

  const handleCancelEditing = () => {
    setProfileForm({ name: profile.name, email: profile.email });
    setAvatarPreview(profile.avatar);
    setIsEditingProfile(false);
    setProfileStatus(null);
  };

  const handleProfileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setProfileForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = profileForm.name.trim();
    const trimmedEmail = profileForm.email.trim();

    if (!trimmedName || !trimmedEmail) {
      setProfileStatus({
        kind: "error",
        text: "Display name and email are required.",
      });
      return;
    }

    setProfile((previous) => ({
      ...previous,
      name: trimmedName,
      email: trimmedEmail,
      avatar: avatarPreview,
    }));

    setIsEditingProfile(false);
    setProfileStatus({
      kind: "success",
      text: "Profile updated for this session.",
    });
  };

  const handlePasswordInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCurrent = passwordForm.currentPassword.trim();
    const trimmedNew = passwordForm.newPassword.trim();
    const trimmedConfirm = passwordForm.confirmPassword.trim();

    if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
      setPasswordStatus({
        kind: "error",
        text: "Please fill out all password fields.",
      });
      return;
    }

    if (trimmedNew.length < 8) {
      setPasswordStatus({
        kind: "error",
        text: "New password must contain at least 8 characters.",
      });
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setPasswordStatus({
        kind: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }

    if (trimmedCurrent === trimmedNew) {
      setPasswordStatus({
        kind: "error",
        text: "New password must be different from the current password.",
      });
      return;
    }

    setPasswordForm(emptyPasswordForm);
    setPasswordStatus({
      kind: "success",
      text: "Password updated for this session.",
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
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
                  <p className="text-base font-semibold text-white">Profile</p>
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

        {profileStatus && (
          <div
            className={`rounded-3xl border p-4 text-sm shadow-lg shadow-black/20 backdrop-blur transition ${
              profileStatus.kind === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-100"
            }`}
            role="status"
            aria-live="polite"
          >
            {profileStatus.text}
          </div>
        )}

        {passwordStatus && (
          <div
            className={`rounded-3xl border p-4 text-sm shadow-lg shadow-black/20 backdrop-blur transition ${
              passwordStatus.kind === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-100"
            }`}
            role="status"
            aria-live="polite"
          >
            {passwordStatus.text}
          </div>
        )}

        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/30 backdrop-blur">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={`${profile.name} avatar`}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-500/40"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500 text-2xl font-semibold text-white shadow-lg shadow-indigo-500/30">
                      {initials.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      {profile.name}
                    </h2>
                    <p className="text-sm text-slate-400">
                      @{profile.username} · {profile.email}
                    </p>
                  </div>
                </div>
                <button
                  className="self-start rounded-2xl border border-indigo-500 px-4 py-2 text-sm font-semibold text-indigo-300 transition hover:border-indigo-400 hover:text-white"
                  onClick={handleStartEditing}
                  type="button"
                >
                  Edit profile
                </button>
              </div>

              <dl className="mt-8 grid gap-4 text-sm text-slate-300 md:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Member since
                  </dt>
                  <dd className="text-lg font-semibold text-white">
                    {profile.memberSince}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Repositories
                  </dt>
                  <dd className="text-lg font-semibold text-white">
                    {profile.repositoriesPublic} public ·{" "}
                    {profile.repositoriesPrivate} private
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Last active
                  </dt>
                  <dd className="text-lg font-semibold text-white">
                    {profile.lastActive}
                  </dd>
                </div>
              </dl>

              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Badges
                </h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {badges.map((badge) => (
                    <span
                      key={badge.label}
                      className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200"
                      title={badge.description}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/30 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Featured repositories
                </h2>
                <Link
                  className="text-sm font-semibold text-indigo-400 transition hover:text-white"
                  href="/repositories"
                >
                  View all
                </Link>
              </div>
              <ul className="mt-6 space-y-4">
                {repositories.map((repo) => (
                  <li
                    key={repo.name}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-indigo-500/40 hover:text-white"
                  >
                    <h3 className="text-lg font-semibold text-white">
                      {repo.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {repo.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>⭐ {repo.stars}</span>
                      <span>{repo.updated}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            {isEditingProfile && (
              <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/30 backdrop-blur">
                <h2 className="text-xl font-semibold text-white">
                  Update profile
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Upload a new profile picture and adjust your contact details.
                  Changes apply immediately for this session.
                </p>
                <form className="mt-6 space-y-5" onSubmit={handleProfileSubmit}>
                  <div className="space-y-1">
                    <label
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                      htmlFor="profile-name"
                    >
                      Display name
                    </label>
                    <input
                      id="profile-name"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileInputChange}
                      placeholder="Full name"
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                      htmlFor="profile-email"
                    >
                      Email address
                    </label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileInputChange}
                      placeholder="Email"
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                      htmlFor="profile-avatar"
                    >
                      Profile picture
                    </label>
                    <input
                      id="profile-avatar"
                      name="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-400"
                    />
                    {avatarPreview && (
                      <div className="mt-3 flex items-center gap-3">
                        <Image
                          src={avatarPreview}
                          alt="Selected profile preview"
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-500/40"
                          unoptimized
                        />
                        <span className="text-xs text-slate-400">
                          Preview of your new profile picture
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-2xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                    >
                      Save profile
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="rounded-2xl border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </article>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/30 backdrop-blur">
              <h2 className="text-xl font-semibold text-white">Activity</h2>
              <ul className="mt-5 space-y-4 text-sm text-slate-300">
                {activity.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.time}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/30 backdrop-blur">
              <h2 className="text-xl font-semibold text-white">
                Change password
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Update your password to secure access to your account.
              </p>
              <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="current-password"
                  >
                    Current password
                  </label>
                  <input
                    id="current-password"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="new-password"
                  >
                    New password
                  </label>
                  <input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    htmlFor="confirm-password"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                >
                  Update password
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/30 backdrop-blur">
              <h2 className="text-xl font-semibold text-white">Quick links</h2>
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
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
