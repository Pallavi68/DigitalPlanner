import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DayState, ISODate, TimeBlock } from '../../types';
import { SLOT_COUNT, slotLabel, slotTime } from '../../lib/dates';
import { tokens } from '../../lib/tokens';
import { useDrag, type DragPayload } from '../../lib/DragContext';
import { uid } from '../../store/seed';
import { useViewport } from '../../hooks/useViewport';

interface Props {
  date: ISODate;
  day: DayState;
  onChange: (blocks: TimeBlock[]) => void;
  onDeleteBlock: (block: TimeBlock) => void;
}

type Interaction =
  | { kind: 'move'; id: string; startY: number; origStart: number; origEnd: number }
  | { kind: 'resize'; id: string; edge: 'top' | 'bottom'; startY: number; origStart: number; origEnd: number };

/** Zone 3 — full-day 30-min Time Alignment grid with drag-drop / move / resize (FR-4, FR-5, FR-15). */
export function TimeAlignment({ date, day, onChange, onDeleteBlock }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { registerGrid } = useDrag();
  const vp = useViewport();
  const phone = vp === 'phone';
  const slotH = phone ? 26 : 19;
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const blocksRef = useRef(day.blocks);
  useLayoutEffect(() => {
    blocksRef.current = day.blocks;
  }, [day.blocks]);

  const slotFromClientY = (clientY: number): number => {
    const el = gridRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top + el.scrollTop;
    return Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor(y / slotH)));
  };

  // Register as the global drop target for items dragged from the To Dos / pool.
  useEffect(() => {
    return registerGrid((payload: DragPayload, _x, clientY) => {
      const el = gridRef.current;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (clientY < rect.top || clientY > rect.bottom) return false;
      const start = slotFromClientY(clientY);
      const span = payload.slots ?? 2;
      const endSlot = Math.min(SLOT_COUNT, start + span);
      const block: TimeBlock = {
        id: uid('blk'),
        date,
        startSlot: start,
        endSlot,
        label: payload.label,
        tag: payload.tag,
        sourceRefId: payload.sourceRefId,
      };
      onChange([...blocksRef.current, block]);
      return true;
    });
  }, [registerGrid, date, onChange, slotH]);

  // Pointer move/resize for existing blocks.
  useEffect(() => {
    if (!interaction) return;
    const move = (ev: PointerEvent) => {
      const deltaSlots = Math.round((ev.clientY - interaction.startY) / slotH);
      const blocks = blocksRef.current.map((b) => {
        if (b.id !== interaction.id) return b;
        if (interaction.kind === 'move') {
          const len = interaction.origEnd - interaction.origStart;
          let start = interaction.origStart + deltaSlots;
          start = Math.max(0, Math.min(SLOT_COUNT - len, start));
          return { ...b, startSlot: start, endSlot: start + len };
        }
        if (interaction.edge === 'top') {
          const start = Math.max(0, Math.min(interaction.origEnd - 1, interaction.origStart + deltaSlots));
          return { ...b, startSlot: start };
        }
        const end = Math.min(SLOT_COUNT, Math.max(interaction.origStart + 1, interaction.origEnd + deltaSlots));
        return { ...b, endSlot: end };
      });
      onChange(blocks);
    };
    const up = () => setInteraction(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [interaction, onChange, slotH]);

  // Overlap detection → render conflicting blocks side by side (manual double-book allowed).
  const laidOut = layoutBlocks(day.blocks);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--gold)', paddingBottom: 10, marginBottom: 12 }}>
        <span style={{ font: "600 12px var(--serif)", letterSpacing: '2.5px', color: 'var(--navy)', textTransform: 'uppercase' }}>Time Alignment</span>
        <span style={{ font: "500 10px var(--serif)", letterSpacing: '2px', color: 'var(--ink-soft)' }}>8AM — 2AM</span>
      </div>

      <div
        ref={gridRef}
        className="paper-scroll"
        style={{
          position: 'relative',
          maxHeight: phone ? '58vh' : 'none',
          overflowY: phone ? 'auto' : 'visible',
          overscrollBehavior: 'contain',
        }}
      >
        {/* ruled slot lines */}
        {Array.from({ length: SLOT_COUNT }, (_, i) => (
          <div key={i} style={{ height: slotH, borderTop: `1px solid ${i % 2 === 0 ? 'var(--rule)' : 'var(--rule-half)'}`, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, top: -6, font: "500 9px var(--serif)", color: 'var(--ink-soft)', width: 44 }}>{slotLabel(i)}</span>
          </div>
        ))}

        {/* blocks */}
        {laidOut.map(({ block: b, col, cols }) => {
          const src = tokens.source[b.tag];
          const top = b.startSlot * slotH;
          const height = (b.endSlot - b.startSlot) * slotH;
          const gutter = 50;
          const width = `calc((100% - ${gutter}px) / ${cols})`;
          const left = `calc(${gutter}px + (100% - ${gutter}px) / ${cols} * ${col})`;
          return (
            <div
              key={b.id}
              role="group"
              aria-label={`${b.label}, ${slotTime(b.startSlot)} to ${slotTime(b.endSlot)}${b.fixed ? ', fixed' : ''}`}
              style={{
                position: 'absolute',
                top,
                height: Math.max(height, slotH),
                left,
                width,
                background: src.bg,
                border: b.fixed ? `1.5px solid ${src.edge}` : undefined,
                borderLeft: `3px solid ${src.edge}`,
                borderRadius: 3,
                padding: '2px 8px',
                boxSizing: 'border-box',
                overflow: 'hidden',
                cursor: b.fixed ? 'default' : 'grab',
                touchAction: 'none',
              }}
              onPointerDown={(e) => {
                if (b.fixed) return;
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                setInteraction({ kind: 'move', id: b.id, startY: e.clientY, origStart: b.startSlot, origEnd: b.endSlot });
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ font: `${phone ? 15 : 15}px var(--hand)`, color: b.fixed ? 'var(--navy)' : 'var(--ink)', lineHeight: 1.15 }}>{b.label}</span>
                <span style={{ display: 'flex', gap: 4, flex: 'none' }}>
                  {b.fixed && <span style={{ font: "600 8px var(--serif)", letterSpacing: '1.5px', color: '#8a7648' }}>◆</span>}
                  <button
                    type="button"
                    aria-label={`Remove ${b.label} from schedule`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onDeleteBlock(b)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--ink-soft)', font: '12px var(--serif)', lineHeight: 1, padding: 2, cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </span>
              </div>

              {/* resize handles (not on fixed blocks) */}
              {!b.fixed && (
                <>
                  <Handle position="top" onDown={(e) => setInteraction({ kind: 'resize', id: b.id, edge: 'top', startY: e.clientY, origStart: b.startSlot, origEnd: b.endSlot })} />
                  <Handle position="bottom" onDown={(e) => setInteraction({ kind: 'resize', id: b.id, edge: 'bottom', startY: e.clientY, origStart: b.startSlot, origEnd: b.endSlot })} />
                </>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ font: "italic 13px var(--hand)", color: 'var(--placeholder)', marginTop: 10 }}>
        drag a to-do (⠿) onto a slot · drag a block to move · drag its edges to resize · ◆ fixed blocks are locked
      </p>
    </div>
  );
}

function Handle({ position, onDown }: { position: 'top' | 'bottom'; onDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        onDown(e);
      }}
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        [position]: 0,
        height: 10,
        cursor: 'ns-resize',
        touchAction: 'none',
      }}
    />
  );
}

/** Assign overlapping blocks to side-by-side columns. */
function layoutBlocks(blocks: TimeBlock[]): { block: TimeBlock; col: number; cols: number }[] {
  const sorted = [...blocks].sort((a, b) => a.startSlot - b.startSlot || a.endSlot - b.endSlot);
  const result: { block: TimeBlock; col: number; cols: number }[] = [];
  let cluster: TimeBlock[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const colEnds: number[] = [];
    const placed = cluster.map((b) => {
      let col = colEnds.findIndex((end) => end <= b.startSlot);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(b.endSlot);
      } else {
        colEnds[col] = b.endSlot;
      }
      return { block: b, col };
    });
    const cols = colEnds.length;
    placed.forEach((p) => result.push({ ...p, cols }));
    cluster = [];
    clusterEnd = -1;
  };

  for (const b of sorted) {
    if (cluster.length && b.startSlot >= clusterEnd) flush();
    cluster.push(b);
    clusterEnd = Math.max(clusterEnd, b.endSlot);
  }
  flush();
  return result;
}
