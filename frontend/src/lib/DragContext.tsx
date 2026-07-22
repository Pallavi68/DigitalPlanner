import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { SourceTag } from '../types';
import { tokens } from './tokens';

export interface DragPayload {
  label: string;
  tag: SourceTag;
  sourceRefId?: string;
  /** Preferred duration in 30-min slots when dropped. */
  slots?: number;
  completed?: boolean;
}

type GridDropHandler = (payload: DragPayload, clientX: number, clientY: number) => boolean;

interface DragCtx {
  startDrag: (payload: DragPayload, e: React.PointerEvent) => void;
  registerGrid: (handler: GridDropHandler) => () => void;
  dragging: boolean;
}

const Ctx = createContext<DragCtx | null>(null);

/**
 * Custom pointer-based drag-and-drop (works with mouse AND touch — FR-5).
 * A single floating "ink chip" ghost follows the finger/cursor; the Time
 * Alignment grid registers a drop handler that turns the drop point into a
 * time block. Touch: press an item and drag; long-press not required because
 * list items are not scroll containers.
 */
export function DragProvider({ children }: { children: ReactNode }) {
  const gridHandler = useRef<GridDropHandler | null>(null);
  const payloadRef = useRef<DragPayload | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; label: string; tag: SourceTag } | null>(null);

  const registerGrid = useCallback((handler: GridDropHandler) => {
    gridHandler.current = handler;
    return () => {
      if (gridHandler.current === handler) gridHandler.current = null;
    };
  }, []);

  const startDrag = useCallback((payload: DragPayload, e: React.PointerEvent) => {
    e.preventDefault();
    payloadRef.current = payload;
    const origin = { x: e.clientX, y: e.clientY };
    let activated = false;

    const move = (ev: PointerEvent) => {
      if (!activated && Math.hypot(ev.clientX - origin.x, ev.clientY - origin.y) < 6) return;
      activated = true;
      setGhost({ x: ev.clientX, y: ev.clientY, label: payload.label, tag: payload.tag });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      const p = payloadRef.current;
      if (activated && p && gridHandler.current) gridHandler.current(p, ev.clientX, ev.clientY);
      payloadRef.current = null;
      setGhost(null);
    };
    const cancel = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      payloadRef.current = null;
      setGhost(null);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  }, []);

  return (
    <Ctx.Provider value={{ startDrag, registerGrid, dragging: !!ghost }}>
      {children}
      {ghost && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: ghost.x + 12,
            top: ghost.y - 14,
            zIndex: 300,
            pointerEvents: 'none',
            font: '15px var(--hand)',
            color: 'var(--ink)',
            background: tokens.source[ghost.tag].bg,
            borderLeft: `3px solid ${tokens.source[ghost.tag].edge}`,
            borderRadius: 3,
            padding: '4px 10px',
            boxShadow: '0 8px 20px rgba(28,33,64,.3)',
            transform: 'rotate(-2deg)',
            maxWidth: 220,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {ghost.label}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useDrag(): DragCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDrag must be used within DragProvider');
  return ctx;
}
