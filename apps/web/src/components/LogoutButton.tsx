"use client";

import { usePollar } from "@pollar/react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const { logout } = usePollar();
  const router = useRouter();
  async function leave() {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    router.push("/");
    router.refresh();
  }
  return <button type="button" className="plain-button" onClick={leave}>Cerrar sesión</button>;
}
