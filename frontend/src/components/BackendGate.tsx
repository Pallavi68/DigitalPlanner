import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  getSession,
  isSupabaseConfigured,
  sendMagicLink,
  signOut,
  subscribeToSession,
} from '../backend';

export function BackendGate({ children }: { children: (userId: string, onSignOut: () => void) => ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(configured);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let alive = true;
    getSession()
      .then((value) => alive && setSession(value))
      .catch(() => alive && setMessage('The sign-in session could not be restored. Please retry.'))
      .finally(() => alive && setChecking(false));
    const unsubscribe = subscribeToSession((value) => {
      setSession(value);
      setChecking(false);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [configured]);

  if (session?.user) return <>{children(session.user.id, () => void signOut())}</>;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await sendMagicLink({ email, redirectTo: window.location.origin });
      setMessage('Check your email for the secure sign-in link. You can use the same email on every device.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The sign-in link could not be sent.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="backend-gate">
      <section className="backend-gate-page" aria-labelledby="cloud-heading">
        <span className="backend-gate-kicker">Your planner, wherever you open it</span>
        <h1 id="cloud-heading">{checking ? 'Opening your book…' : 'Open your Digital Planner'}</h1>
        {!configured ? (
          <p role="alert">
            Cloud sync is not configured. Add <code>VITE_SUPABASE_URL</code> and
            {' '}<code>VITE_SUPABASE_PUBLISHABLE_KEY</code>, then restart the app.
          </p>
        ) : checking ? (
          <p>Restoring the secure Supabase session.</p>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="planner-email">Email address</label>
            <input id="planner-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
            {message && <p className="backend-gate-message" role="status">{message}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
