import { type ReactNode } from 'react';

/** Serif structural label with the gold underline used across pages. */
export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ font: "600 12px var(--serif)", letterSpacing: '2.5px', color: 'var(--navy)', textTransform: 'uppercase' }}>{children}</span>
        {right}
      </div>
      <div style={{ width: 28, height: 2, background: 'var(--gold)', marginTop: 4 }} />
    </div>
  );
}

/** Date header (serif) used on the Daily page and elsewhere. */
export function DateHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, borderBottom: '1px solid var(--gold)', paddingBottom: 10, marginBottom: 16 }}>
      <span style={{ font: "500 11px var(--serif)", letterSpacing: '3px', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>{eyebrow}</span>
      <span style={{ font: "600 26px var(--serif)", color: 'var(--navy)' }}>{title}</span>
    </div>
  );
}

/** A gentle pencil-prompt empty affordance (never a modern "no items" card). */
export function PencilPrompt({ children }: { children: ReactNode }) {
  return <div style={{ font: "italic 14px var(--hand)", color: 'var(--placeholder)' }}>{children}</div>;
}
