"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginClient() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.push(next);
    else setErr("Wrong password");
  }

  return (
<main className="flex min-h-screen pt-60 justify-center">
  <div className="w-full max-w-sm p-6">
    <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin secret"
        className="w-full border rounded p-2"
      />
      <button className="w-full rounded p-2 border" type="submit">
        Enter
      </button>
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </form>
  </div>
</main>

  );
}
