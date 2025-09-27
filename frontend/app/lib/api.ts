export const API_BASE_URL = "http://localhost:8080/api";

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean; // <-- NEW: whether this request should include token
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

// 🔑 Now automatically includes token from localStorage
export async function fetchExploreRepositories() {
  return request<ExploreRepository[]>("/repositories/explore", {
    method: "GET",
    auth: true,
  });
}
