"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Example protected request
    fetch("http://localhost:8080/api/repositories/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-6 border rounded shadow-md w-96">
        <h1 className="text-xl mb-4 font-bold">Profile</h1>
        {user ? (
          <pre>{JSON.stringify(user, null, 2)}</pre>
        ) : (
          <p>Loading or not authorized...</p>
        )}
      </div>
    </div>
  );
}
