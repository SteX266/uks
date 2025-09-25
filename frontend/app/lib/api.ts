export const API_BASE_URL = "http://localhost:8080/api";

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
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
