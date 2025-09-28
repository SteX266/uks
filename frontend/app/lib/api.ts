export const API_BASE_URL = "http://localhost:8080/api";

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const token = localStorage.getItem("authToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let payload: unknown = undefined;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      console.error("Failed to parse response", error);
    }
  }

  if (!response.ok) {
    const message =
      (payload as { message?: string; error?: string } | undefined)?.message ??
      (payload as { message?: string; error?: string } | undefined)?.error ??
      "Unexpected error";
    throw new Error(message);
  }

  return payload as T;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload) {
  return request<{ message: string }>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(payload: LoginPayload) {
  return request<{ token: string }>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export type RepositoryBadgeLabel =
  | "Docker Official Image"
  | "Verified Publisher"
  | "Sponsored OSS";

export interface ExploreRepository {
  id: number;
  name: string;
  namespace: string;
  description: string | null;
  badges: RepositoryBadgeLabel[];
  tags: string[];
  stars: number;
  pulls: number;
  updatedAt: string | null;
}

export async function fetchExploreRepositories() {
  return request<ExploreRepository[]>("/repositories/explore", {
    method: "GET",
    auth: true,
  });
}

export interface UserRepository {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  isOfficial: boolean;
  ownerUsername: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RepositoryTag {
  id: number;
  name: string;
  artifactDigest: string;
  repositoryName: string;
}

export interface RepositoryPayload {
  name: string;
  description: string | null;
  isPublic: boolean;
}

export interface RepositoryArtifact {
  id: number;
  digest: string;
  size: number | null;
  mediaType: string | null;
  repositoryName: string;
  createdAt: string | null;
}

export async function fetchMyRepositories() {
  return request<UserRepository[]>("/repositories/me", {
    method: "GET",
    auth: true,
  });
}

export async function createRepository(payload: RepositoryPayload) {
  return request<UserRepository>("/repositories", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export async function updateRepository(id: number, payload: RepositoryPayload) {
  return request<UserRepository>(`/repositories/${id}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export async function deleteRepository(id: number) {
  return request<void>(`/repositories/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function fetchRepositoryTags(repoId: number) {
  return request<RepositoryTag[]>(`/repositories/${repoId}/tags`, {
    method: "GET",
    auth: true,
  });
}

export interface ArtifactPayload {
  digest: string;
  size: number | null;
  mediaType: string | null;
}

export interface TagPayload {
  name: string;
  digest: string;
}

export async function fetchRepositoryArtifacts(repoId: number) {
  return request<RepositoryArtifact[]>(`/repositories/${repoId}/artifacts`, {
    method: "GET",
    auth: true,
  });
}

export async function createRepositoryArtifact(
  repoId: number,
  payload: ArtifactPayload
) {
  return request<RepositoryArtifact>(`/repositories/${repoId}/artifacts`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export async function createRepositoryTag(repoId: number, payload: TagPayload) {
  return request<RepositoryTag>(`/repositories/${repoId}/tags`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export async function deleteRepositoryTag(repoId: number, tagName: string) {
  return request<void>(
    `/repositories/${repoId}/tags/${encodeURIComponent(tagName)}`,
    {
      method: "DELETE",
      auth: true,
    }
  );
}

export interface ProfileBadge {
  label: string;
  description: string;
}

export interface ProfileRepositorySummary {
  name: string;
  description: string | null;
  stars: number;
  updatedAt: string | null;
}

export interface ProfileActivityItem {
  title: string;
  detail: string;
  occurredAt: string;
}

export interface ProfileResponse {
  displayName: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  memberSince: string;
  lastActive: string | null;
  repositoriesPublic: number;
  repositoriesPrivate: number;
  badges: ProfileBadge[];
  featuredRepositories: ProfileRepositorySummary[];
  recentActivity: ProfileActivityItem[];
}

export interface UpdateProfilePayload {
  displayName: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function fetchProfile() {
  return request<ProfileResponse>("/profile", {
    method: "GET",
    auth: true,
  });
}

export async function updateProfile(payload: UpdateProfilePayload) {
  return request<ProfileResponse>("/profile", {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export async function updatePassword(payload: UpdatePasswordPayload) {
  return request<{ message: string }>("/profile/password", {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export interface AdminUser {
  id: number;
  displayName: string | null;
  username: string;
  email: string;
  bio: string | null;
  active: boolean;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  repositoryCount: number;
  badges: string[];
  roles: string[];
}

export interface UpdateAdminUserPayload {
  displayName?: string;
  username?: string;
  email?: string;
  bio?: string | null;
  active?: boolean;
  badges?: string[];
}

export interface CreateAdminUserPayload {
  displayName: string;
  username: string;
  email: string;
  password: string;
  bio?: string | null;
}

export async function fetchAdminUsers() {
  return request<AdminUser[]>("/admin/users", {
    method: "GET",
    auth: true,
  });
}

export async function updateAdminUser(
  userId: number,
  payload: UpdateAdminUserPayload
) {
  return request<AdminUser>(`/admin/users/${userId}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export async function deleteAdminUser(userId: number) {
  return request<void>(`/admin/users/${userId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function createAdminUser(payload: CreateAdminUserPayload) {
  return request<AdminUser>("/admin/users", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export interface AnalyticsQueryPayload {
  query: string;
  from?: number;
  size?: number;
}

export interface LogSearchHit {
  id: string | null;
  score: number | null;
  timestamp: string | null;
  level: string | null;
  message: string | null;
  raw: string | null;
  source: string | null;
  highlight: string | null;
}

export interface LogSearchResponse {
  total: number;
  took: number;
  translatedQuery: string;
  hits: LogSearchHit[];
}

export async function searchSystemLogs(payload: AnalyticsQueryPayload) {
  return request<LogSearchResponse>("/admin/analytics/search", {
    method: "POST",
    body: payload,
    auth: true,
  });
}
