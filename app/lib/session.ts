import { headers } from "next/headers";
import { apiUrl } from "./api";

export type ServerSessionUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  restaurantId?: string | null;
};

export type ServerSession = {
  user?: ServerSessionUser | null;
} | null;

// Replaces the monolith's direct `auth.api.getSession()` calls in server
// components: the session now lives in the Auth Service, reached through the
// API Gateway with the browser's cookies forwarded.
export async function getServerSession(): Promise<ServerSession> {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  try {
    const res = await fetch(apiUrl("/api/auth/get-session"), {
      headers: { cookie },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
