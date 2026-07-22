import { usePlanner } from '../store/PlannerContext';

/**
 * Local-save indicator — lives quietly in the book chrome. Cloud sync is a
 * future storage-adapter concern and must not be implied by this milestone.
 */
export function SyncIndicator() {
  const { status, online, retrySave } = usePlanner();

  const label =
    status === 'failed'
      ? 'Local save failed'
      : !online || status === 'offline'
      ? 'Saved locally — offline'
      : status === 'saving'
      ? 'Saving locally…'
      : status === 'loading'
      ? 'Opening…'
      : 'Saved locally';

  const dot = status === 'failed' || !online || status === 'offline' ? 'var(--terracotta)' : status === 'synced' ? 'var(--check)' : 'var(--gold)';

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
      {status === 'failed' && <button type="button" onClick={retrySave} style={{ border: 0, background: 'transparent', color: 'var(--cream)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', letterSpacing: 'inherit', padding: 4 }}>Retry</button>}
    </span>
  );
}
