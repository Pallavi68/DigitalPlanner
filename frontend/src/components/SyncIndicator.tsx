import { usePlanner } from '../store/PlannerContext';

/**
 * Honest cloud-sync indicator that distinguishes cached/offline state from
 * writes confirmed by Supabase.
 */
export function SyncIndicator() {
  const { status, online, retrySave, downloadRecoveryBackup, signOut, syncDetail } = usePlanner();

  const label =
    status === 'failed'
      ? 'Sync failed'
      : !online || status === 'offline'
      ? 'Offline — will sync'
      : status === 'saving'
      ? 'Saving…'
      : status === 'loading'
      ? 'Opening…'
      : 'Synced';

  const dot = status === 'failed' || !online || status === 'offline' ? 'var(--terracotta)' : status === 'synced' ? 'var(--check)' : 'var(--gold)';
  const detail = syncDetail ?? (status === 'synced'
    ? 'All planner changes are saved to Supabase.'
    : `${label}. Unsynced changes remain on this device until a cloud save succeeds.`);

  return (
    <span
      title={detail}
      aria-label={detail}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        font: "500 11px var(--serif)",
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'rgba(243,235,218,.75)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dot,
          boxShadow: status === 'saving' ? '0 0 0 3px rgba(184,152,90,.25)' : 'none',
          transition: 'background 200ms',
        }}
      />
      {label}
      {status === 'failed' && <button type="button" onClick={retrySave} style={{ border: 0, background: 'transparent', color: 'var(--cream)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', letterSpacing: 'inherit', padding: 4 }}>Retry</button>}
      {status === 'failed' && <button type="button" onClick={downloadRecoveryBackup} style={{ border: 0, background: 'transparent', color: 'var(--cream)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', letterSpacing: 'inherit', padding: 4 }}>Back up</button>}
      <button type="button" onClick={signOut} aria-label="Sign out of cloud planner" title="Sign out" style={{ border: 0, background: 'transparent', color: 'var(--cream)', cursor: 'pointer', font: 'inherit', padding: 4 }}>↪</button>
    </span>
  );
}
