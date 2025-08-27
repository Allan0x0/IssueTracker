import z from "zod";
import { useMemo } from 'react';
import { AppLinks } from './links';
import { useMatches } from 'react-router';
import type { User } from './generated/prisma/client';

const SuccessSchema = z.object({ success: z.literal(true) });
export function hasSuccess (data: unknown): data is z.infer<typeof SuccessSchema> {
  return SuccessSchema.safeParse(data).success;
}

const ErrSchema = z.object({ err: z.string() });
export function hasErr (data: unknown): data is z.infer<typeof ErrSchema> {
  return ErrSchema.safeParse(data).success;
}

const Schema = z.object({ message: z.string() });
export function getErrorMessage (data: unknown) {
  const result = Schema.safeParse(data);
  if (result.success) {
    return result.data.message;
  }
  return "Something went wrong, please try again";
}

const DEFAULT_REDIRECT = AppLinks.Index;

export async function getRawFormFields (request: Request) {
  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT,
) {
  if (!to || typeof to !== 'string') {
    return defaultRedirect;
  }

  if (!to.startsWith('/') || to.startsWith('//')) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string,
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id],
  );
  return route?.data as Record<string, unknown>;
}

function isUser(user: unknown): user is User {
  const Schema = z.object({ username: z.string() });
  return Schema.safeParse(user).success;
}

export function useOptionalUser(): User | undefined {
  const data = useMatchesData('root');
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser(): User {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      'No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.',
    );
  }
  return maybeUser;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length > 3 && email.includes('@');
}