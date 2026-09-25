import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

export type SessionData = {
  isLoggedIn: boolean;
  userId?: string;
  email?: string;
  role?: Role;
  pollarSubject?: string | null;
  displayName?: string;
};

export const defaultSession: SessionData = { isLoggedIn: false };

export function getSessionOptions(): SessionOptions {
  const password =
    process.env.SESSION_SECRET ||
    "pulso-dev-session-secret-min-32-chars-xx";
  if (password.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return {
    password,
    cookieName: "pulso_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId || !session.role) return null;
  if (roles && !roles.includes(session.role)) return null;
  return session as SessionData & {
    isLoggedIn: true;
    userId: string;
    email: string;
    role: Role;
    displayName: string;
  };
}
