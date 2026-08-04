import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from './client';
import { asBackendError, BackendError } from './errors';

export interface MagicLinkOptions {
  email: string;
  redirectTo?: string;
}

export async function sendMagicLink({ email, redirectTo }: MagicLinkOptions): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new TypeError('Email is required.');
  const { error } = await getSupabaseClient().auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: redirectTo ?? (typeof window === 'undefined' ? undefined : window.location.origin),
      shouldCreateUser: true,
    },
  });
  if (error) throw asBackendError(error, 'Could not send the sign-in link.');
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw asBackendError(error, 'Could not restore the sign-in session.');
  return data.session;
}

export async function requireUser(): Promise<User> {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw asBackendError(error, 'Could not verify the signed-in user.');
  if (!data.user) throw new BackendError('not_authenticated', 'Sign in to use cloud sync.');
  return data.user;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw asBackendError(error, 'Could not sign out.');
}

export function subscribeToSession(
  listener: (session: Session | null, event: AuthChangeEvent) => void,
): () => void {
  const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => listener(session, event));
  return () => data.subscription.unsubscribe();
}
