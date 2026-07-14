import { usePlanner } from '../store/PlannerContext';

/**
 * Sync/offline indicator (design brief §5) — lives quietly in the book chrome.
 * Non-blocking; reflects the storage adapter's state.
 */
export function SyncIndicator() {
  const { status, online } = usePlanner();

  const label =
    !online || status === 'offline'
      ? 'Offline — will sync'
      : status === 'saving'
      ? 'Saving…'
      : status === 'loading'
      ? 'Opening…'
      : 'Synced';

  const dot = !online || status === 'offline' ? 'var(--terracotta)' : status === 'synced' ? 'var(--check)' : 'var(--gold)';

  return (
    <span
      title={label}
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
    </span>
  );
}
