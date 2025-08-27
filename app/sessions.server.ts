import { createCookieSessionStorage, redirect } from "react-router";
import { Env } from "./environment.server";
import { getUserById } from "./users.server";
import { AppLinks } from "./links";
import type { User } from "./generated/prisma/client";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [Env.SESSION_SECRET],
    secure: Env.NODE_ENV === 'production',
  },
});

const USER_SESSION_KEY = 'userId';

export async function getSession(request: Request) {
  const cookie = request.headers.get('Cookie');
  return sessionStorage.getSession(cookie);
}

export async function getUserId(
  request: Request,
): Promise<User['id'] | undefined> {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (userId === undefined) return null;

  const user = await getUserById(userId);
  if (user) {
    const { password: _, ...restOfDetails } = user;
    return restOfDetails;
  }
  throw await logout(request);
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname,
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`${AppLinks.Login}?${searchParams}`);
  }
  return userId;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);

  const user = await getUserById(userId);
  if (user) {
    return user;
  }
  throw await logout(request);
}

interface CreateUserSessionProps {
  request: Request;
  userId: number;
  remember: boolean;
  redirectTo: string;
}
export async function createUserSession(props: CreateUserSessionProps) {
  const { request, userId, remember, redirectTo } = props;
  
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session, {
        maxAge: remember
          ? 60 * 60 * 24 * 7 // 7 days
          : undefined,
      }),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}
