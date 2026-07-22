import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  labelledBy?: string;
}

/** Accessible modal: focus-trap-lite, Escape to close, backdrop click, aria. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('[data-autofocus], button, input, textarea, select')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28,33,64,.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 100,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: 'min(760px, 100%)',
          maxHeight: '86vh',
          overflow: 'auto',
          background: 'var(--paper)',
          borderRadius: 8,
          border: '1px solid var(--gold)',
          boxShadow: '0 24px 60px rgba(28,33,64,.4)',
          padding: '22px 24px',
        }}
        className="paper-scroll"
      >
        <h2 style={{ margin: '0 0 14px', font: "600 20px var(--serif)", color: 'var(--navy)' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
