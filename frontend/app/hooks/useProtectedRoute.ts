"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCurrentUser,
  type AuthenticatedUser,
  type UserRole,
} from "../lib/api";

interface UseProtectedRouteOptions {
  allowedRoles: UserRole[];
  redirectOnFail: string;
}

interface UseProtectedRouteResult {
  user: AuthenticatedUser | null;
  isLoading: boolean;
}

export function useProtectedRoute({
  allowedRoles,
  redirectOnFail,
}: UseProtectedRouteOptions): UseProtectedRouteResult {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const rolesKey = useMemo(
    () => allowedRoles.slice().sort().join("|"),
    [allowedRoles],
  );

  useEffect(() => {
    let isActive = true;

    const token = typeof window !== "undefined"
      ? localStorage.getItem("authToken")
      : null;

    if (!token) {
      router.replace("/login");
      return () => {
        isActive = false;
      };
    }

    setStatus("loading");

    const allowedRoleSet = new Set<UserRole>(
      rolesKey ? (rolesKey.split("|") as UserRole[]) : [],
    );

    fetchCurrentUser()
      .then((data) => {
        if (!isActive) {
          return;
        }

        const hasAllowedRole =
          allowedRoleSet.size === 0 ||
          data.roles.some((role) => allowedRoleSet.has(role));

        if (!hasAllowedRole) {
          router.replace(redirectOnFail);
          return;
        }

        localStorage.setItem("username", data.username);
        setUser(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        router.replace("/login");
      });

    return () => {
      isActive = false;
    };
  }, [redirectOnFail, rolesKey, router]);

  return {
    user,
    isLoading: status === "loading",
  };
}
