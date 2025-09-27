"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  fetchProfile,
  updatePassword as updatePasswordRequest,
  updateProfile as updateProfileRequest,
  ProfileResponse,
} from "../lib/api";

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileFormState = {
  displayName: string;
  email: string;
  bio: string;
};

type StatusMessage = {
  kind: "success" | "error";
  text: string;
} | null;

const quickLinks = [
  { href: "/explore", label: "Browse repositories" },
  { href: "/admin/users", label: "Manage users" },
  { href: "/repositories", label: "Create repository" },
];

const emptyPasswordForm: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function formatAbsoluteDate(iso: string | null) {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatRelativeTime(iso: string | null) {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const diff = Date.now() - date.getTime();
  if (diff <= 0) {
    return "Just now";
  }

  const seconds = Math.round(diff / 1000);
  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const weeks = Math.round(days / 7);
  if (weeks < 5) {
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    displayName: "",
    email: "",
    bio: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<StatusMessage>(null);

  const [passwordForm, setPasswordForm] =
    useState<PasswordFormState>(emptyPasswordForm);
  const [passwordStatus, setPasswordStatus] = useState<StatusMessage>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setProfileStatus(null);
    setPasswordStatus(null);
    setPasswordForm(emptyPasswordForm);

    try {
      const response = await fetchProfile();
      if (!mountedRef.current) {
        return;
      }

      setProfile(response);
      setProfileForm({
        displayName: response.displayName ?? "",
        email: response.email ?? "",
        bio: response.bio ?? "",
      });
      setAvatarPreview(response.avatarUrl ?? null);
      setIsEditingProfile(false);
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load profile information.";
      setLoadError(message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadProfile();

    return () => {
      mountedRef.current = false;
    };
  }, [loadProfile]);

  const initials = useMemo(() => {
    const name = profile?.displayName ?? profile?.username ?? "";
    const trimmed = name.trim();
    if (!trimmed) {
      return "";
    }

    const parts = trimmed.split(" ");
    if (parts.length === 1) {
      const [first] = parts;
      return (first?.[0] ?? "") + (first?.[1] ?? "");
    }

    return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  }, [profile?.displayName, profile?.username]);

  const handleStartEditing = () => {
    if (!profile) {
      return;
    }

    setProfileForm({
      displayName: profile.displayName ?? "",
      email: profile.email ?? "",
      bio: profile.bio ?? "",
    });
    setAvatarPreview(profile.avatarUrl ?? null);
    setProfileStatus(null);
    setIsEditingProfile(true);
  };

  const handleCancelEditing = () => {
    if (!profile) {
      return;
    }

    setProfileForm({
      displayName: profile.displayName ?? "",
      email: profile.email ?? "",
      bio: profile.bio ?? "",
    });
    setAvatarPreview(profile.avatarUrl ?? null);
    setProfileStatus(null);
    setIsEditingProfile(false);
  };

  const handleProfileInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setProfileForm((previous) => ({ ...previous, [name]: value }));
    setProfileStatus(null);
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      setProfileStatus(null);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedDisplayName = profileForm.displayName.trim();
    const trimmedEmail = profileForm.email.trim();
    const trimmedBio = profileForm.bio.trim();

    if (!trimmedDisplayName || !trimmedEmail) {
      setProfileStatus({
        kind: "error",
        text: "Display name and email are required.",
      });
      return;
    }

    setIsSavingProfile(true);
    setProfileStatus(null);

    try {
      const updated = await updateProfileRequest({
        displayName: trimmedDisplayName,
        email: trimmedEmail,
        bio: trimmedBio || null,
        avatarUrl: avatarPreview ?? null,
      });

      if (!mountedRef.current) {
        return;
      }

      setProfile(updated);
      setProfileForm({
        displayName: updated.displayName ?? "",
        email: updated.email ?? "",
        bio: updated.bio ?? "",
      });
      setAvatarPreview(updated.avatarUrl ?? null);
      setProfileStatus({
        kind: "success",
        text: "Profile updated successfully.",
      });
      setIsEditingProfile(false);
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Failed to update profile.";
      setProfileStatus({ kind: "error", text: message });
    } finally {
      if (mountedRef.current) {
        setIsSavingProfile(false);
      }
    }
  };

  const handlePasswordInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
    setPasswordStatus(null);
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    setIsUpdatingPassword(true);

    try {
      await updatePasswordRequest({
        currentPassword: trimmedCurrent,
        newPassword: trimmedNew,
      });

      if (!mountedRef.current) {
        return;
      }

      setPasswordForm(emptyPasswordForm);
      setPasswordStatus({
        kind: "success",
        text: "Password updated successfully.",
      });
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Failed to update password.";
      setPasswordStatus({ kind: "error", text: message });
    } finally {
      if (mountedRef.current) {
        setIsUpdatingPassword(false);
      }
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 py-12 text-slate-100">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 px-8 py-12 text-center text-sm text-slate-300 shadow-xl shadow-black/30 backdrop-blur">
            Loading profile...
          </div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 py-12 text-slate-100">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-100 shadow-lg shadow-black/30 backdrop-blur">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => void loadProfile()}
              className="mt-4 rounded-2xl border border-rose-300/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-100 transition hover:border-rose-200 hover:text-white"
            >
              Retry loading profile
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 py-12 text-slate-100">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 px-8 py-12 text-center text-sm text-slate-300 shadow-xl shadow-black/30 backdrop-blur">
            Profile information is unavailable.
          </div>
        </div>
      </main>
    );
  }

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
                  className="rounded-full border border-white/40 px-4 py-2 transition hover:border-white hover:bg-white/10"
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
                  className="rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
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
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={`${profile.displayName} avatar`}
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
                      {profile.displayName}
                    </h2>
                    <p className="text-sm text-slate-400">
                      @{profile.username} · {profile.email}
                    </p>
                    {profile.bio ? (
                      <p className="mt-2 text-sm text-slate-300">
                        {profile.bio}
                      </p>
                    ) : null}
                  </div>
                </div>
                {!isEditingProfile ? (
                  <button
                    className="self-start rounded-2xl border border-indigo-500 px-4 py-2 text-sm font-semibold text-indigo-300 transition hover:border-indigo-400 hover:text-white"
                    onClick={handleStartEditing}
                    type="button"
                  >
                    Edit profile
                  </button>
                ) : null}
              </div>

              <dl className="mt-8 grid gap-4 text-sm text-slate-300 md:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Member since
                  </dt>
                  <dd className="text-lg font-semibold text-white">
                    {formatAbsoluteDate(profile.memberSince)}
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
                    {formatRelativeTime(profile.lastActive)}
                  </dd>
                </div>
              </dl>

              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Badges
                </h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {profile.badges.length > 0 ? (
                    profile.badges.map((badge) => (
                      <span
                        key={badge.label}
                        className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200"
                        title={badge.description}
                      >
                        {badge.label}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      No badges earned yet.
                    </p>
                  )}
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
                {profile.featuredRepositories.length > 0 ? (
                  profile.featuredRepositories.map((repo) => (
                    <li
                      key={repo.name}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-indigo-500/40 hover:text-white"
                    >
                      <h3 className="text-lg font-semibold text-white">
                        {repo.name}
                      </h3>
                      {repo.description ? (
                        <p className="mt-1 text-sm text-slate-400">
                          {repo.description}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>⭐ {repo.stars}</span>
                        <span>
                          {repo.updatedAt
                            ? `Updated ${formatRelativeTime(repo.updatedAt)}`
                            : "Update time unavailable"}
                        </span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                    No repositories to feature yet. Create one to see it here.
                  </li>
                )}
              </ul>
            </article>

            {isEditingProfile && (
              <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/30 backdrop-blur">
                <h2 className="text-xl font-semibold text-white">
                  Update profile
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Upload a new profile picture and adjust your contact details.
                  Changes apply immediately after saving.
                </p>
                <form className="mt-6 space-y-5" onSubmit={handleProfileSubmit}>
                  <div className="space-y-1">
                    <label
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                      htmlFor="profile-display-name"
                    >
                      Display name
                    </label>
                    <input
                      id="profile-display-name"
                      name="displayName"
                      value={profileForm.displayName}
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
                      htmlFor="profile-bio"
                    >
                      Bio
                    </label>
                    <textarea
                      id="profile-bio"
                      name="bio"
                      value={profileForm.bio}
                      onChange={handleProfileInputChange}
                      rows={3}
                      placeholder="Tell others a bit about your work"
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
                      className="w-full rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/70 px-4 py-3 text-xs text-slate-400 transition hover:border-indigo-500/60 hover:text-slate-200"
                    />
                    <p className="text-xs text-slate-500">
                      Images are stored for this session only in this demo.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="rounded-2xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:bg-indigo-500/50"
                    >
                      {isSavingProfile ? "Saving..." : "Save changes"}
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
                {profile.recentActivity.length > 0 ? (
                  profile.recentActivity.map((item) => (
                    <li
                      key={`${item.title}-${item.occurredAt}`}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatRelativeTime(item.occurredAt)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.detail}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-500">
                    No activity has been recorded yet.
                  </li>
                )}
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
                  disabled={isUpdatingPassword}
                  className="w-full rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:bg-indigo-500/50"
                >
                  {isUpdatingPassword ? "Updating..." : "Update password"}
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
