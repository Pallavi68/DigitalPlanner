import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DayState, ISODate, TimeBlock } from '../../types';
import { SLOT_COUNT, slotLabel, slotTime } from '../../lib/dates';
import { tokens } from '../../lib/tokens';
import { useDrag, type DragPayload } from '../../lib/DragContext';
import { uid } from '../../store/seed';
import { useViewport } from '../../hooks/useViewport';
import { Modal } from '../../components/Modal';

interface Props {
  date: ISODate;
  day: DayState;
  onChange: (blocks: TimeBlock[]) => void;
  onDeleteBlock: (block: TimeBlock) => void;
  onToggleBlock: (block: TimeBlock) => void;
  onUpdateBlock: (block: TimeBlock) => void;
}

type Interaction =
  | { kind: 'move'; id: string; startY: number; origStart: number; origEnd: number }
  | { kind: 'resize'; id: string; edge: 'top' | 'bottom'; startY: number; origStart: number; origEnd: number };

/** Zone 3 — full-day 30-min Time Alignment grid with drag-drop / move / resize (FR-4, FR-5, FR-15). */
export function TimeAlignment({ date, day, onChange, onDeleteBlock, onToggleBlock, onUpdateBlock }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { registerGrid } = useDrag();
  const vp = useViewport();
  const phone = vp === 'phone';
  const slotH = phone ? 32 : 30;
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
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
    return registerGrid((payload: DragPayload, clientX, clientY) => {
      const el = gridRef.current;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;
      if ((payload.tag === 'routine' || payload.tag === 'chore') && payload.sourceRefId && blocksRef.current.some((block) => block.sourceRefId === payload.sourceRefId)) {
        if (!window.confirm(`“${payload.label}” is already on this day. Add it again?`)) return true;
      }
      const start = slotFromClientY(clientY);
      const span = payload.slots ?? 2;
      const endSlot = Math.min(SLOT_COUNT, start + span);
      if (endSlot - start < span) window.alert('The block was shortened to fit at the end of the day.');
      const block: TimeBlock = {
        id: uid('blk'),
        date,
        startSlot: start,
        endSlot,
        label: payload.label,
        tag: payload.tag,
        sourceRefId: payload.sourceRefId,
        completed: payload.completed,
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
  const minimumVisualHeight = phone ? 20 : 18;
  const laidOut = layoutBlocks(day.blocks, minimumVisualHeight / slotH);

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
          const compact = height < 24;
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
                height: Math.max(height, minimumVisualHeight),
                left,
                width,
                background: src.bg,
                border: b.fixed ? `1.5px solid ${src.edge}` : undefined,
                borderLeft: `3px solid ${src.edge}`,
                borderRadius: 3,
                padding: compact ? '1px 58px 1px 6px' : '4px 80px 3px 8px',
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
              <div>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Edit details for ${b.label}`}
                  onClick={(event) => { event.stopPropagation(); setDetailId(b.id); }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      setDetailId(b.id);
                    }
                  }}
                  style={{ font: `${phone ? 15 : 15}px var(--hand)`, color: b.fixed ? 'var(--navy)' : 'var(--ink)', lineHeight: 1.15, textDecoration: b.completed ? 'line-through' : undefined, opacity: b.completed ? .65 : 1, cursor: 'pointer' }}
                >{b.label}</span>
                {b.note && <BlockNote note={b.note} compact onChange={(note) => onUpdateBlock({ ...b, note })} />}
                <span style={{ position: 'absolute', right: 2, top: 0, display: 'flex', gap: 1, zIndex: 3 }}>
                  {b.fixed && <span style={{ font: "600 8px var(--serif)", letterSpacing: '1.5px', color: '#8a7648' }}>◆</span>}
                  <button
                    type="button"
                    aria-label={`Edit notes for ${b.label}`}
                    title="Edit notes"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setDetailId(b.id); }}
                    style={{ width: compact ? 18 : 24, height: compact ? 18 : 24, border: 'none', background: 'rgba(255,255,255,.8)', color: 'var(--ink-soft)', font: `${compact ? 10 : 13}px var(--serif)`, lineHeight: 1, padding: 0, cursor: 'pointer', borderRadius: 3 }}
                  >✎</button>
                  <button
                    type="button"
                    aria-label={`Mark ${b.label} ${b.completed ? 'not done' : 'done'}`}
                    aria-pressed={!!b.completed}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onToggleBlock(b); }}
                    style={{ width: compact ? 18 : 24, height: compact ? 18 : 24, border: 'none', background: 'rgba(255,255,255,.8)', color: 'var(--ink)', font: `${compact ? 11 : 14}px var(--serif)`, lineHeight: 1, padding: 0, cursor: 'pointer', borderRadius: 3 }}
                  >{b.completed ? '✓' : '○'}</button>
                  <button
                    type="button"
                    aria-label={`Remove ${b.label} from schedule`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onDeleteBlock(b); }}
                    style={{ width: compact ? 18 : 24, height: compact ? 18 : 24, border: 'none', background: 'rgba(255,255,255,.8)', color: 'var(--ink-soft)', font: `${compact ? 11 : 14}px var(--serif)`, lineHeight: 1, padding: 0, cursor: 'pointer', borderRadius: 3 }}
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
        click a block for notes · drag to move · drag edges to resize · ◆ fixed blocks are locked
      </p>
      {(() => {
        const block = day.blocks.find((candidate) => candidate.id === detailId);
        return (
          <Modal open={!!block} onClose={() => setDetailId(null)} title={block ? `${block.label} details` : 'Block details'}>
            {block && (
              <div style={{ display: 'grid', gap: 8, font: '500 12px var(--serif)', color: 'var(--navy)' }}>
                <label htmlFor={`block-note-${block.id}`}>Notes or description</label>
                <textarea
                  id={`block-note-${block.id}`}
                  data-autofocus
                  value={block.note ?? ''}
                  maxLength={5000}
                  rows={5}
                  onChange={(event) => onUpdateBlock({ ...block, note: event.target.value })}
                  placeholder="Add small details you want to remember…"
                  style={{ width: '100%', resize: 'vertical', padding: 10, border: '1px solid var(--rule)', background: 'rgba(255,255,255,.45)', color: 'var(--ink)', font: '15px var(--hand)' }}
                />
                <small style={{ color: 'var(--ink-soft)', font: '12px var(--serif)' }}>Type <code>- [ ] task</code> or <code>[ ] task</code> on its own line to create a persistent checkbox.</small>
                {block.note && <BlockNote note={block.note} onChange={(note) => onUpdateBlock({ ...block, note })} />}
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}

const CHECKBOX_LINE = /^(\s*(?:-\s*)?)\[([ xX])\](\s+.*)$/;

function BlockNote({ note, onChange, compact = false }: { note: string; onChange: (note: string) => void; compact?: boolean }) {
  const lines = note.split('\n');
  const toggle = (index: number) => {
    const match = lines[index].match(CHECKBOX_LINE);
    if (!match) return;
    const next = lines.slice();
    next[index] = `${match[1]}[${match[2].toLowerCase() === 'x' ? ' ' : 'x'}]${match[3]}`;
    onChange(next.join('\n'));
  };
  return (
    <span style={{ display: 'grid', gap: compact ? 1 : 5, marginTop: compact ? 2 : 10, color: 'var(--ink-soft)', font: `${compact ? 11 : 13}px var(--serif)`, lineHeight: 1.25 }}>
      {lines.map((line, index) => {
        const match = line.match(CHECKBOX_LINE);
        if (!match) return line ? <span key={`${index}-${line}`}>{line}</span> : null;
        const checked = match[2].toLowerCase() === 'x';
        return (
          <label key={`${index}-${line}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, cursor: 'pointer', textDecoration: checked ? 'line-through' : undefined }}>
            <input
              type="checkbox"
              checked={checked}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onChange={() => toggle(index)}
              style={{ margin: '1px 0 0' }}
            />
            <span>{match[3].trim()}</span>
          </label>
        );
      })}
    </span>
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
        height: 4,
        cursor: 'ns-resize',
        touchAction: 'none',
      }}
    />
  );
}

/** Assign overlapping blocks to side-by-side columns. */
function layoutBlocks(blocks: TimeBlock[], minimumSpan = 0): { block: TimeBlock; col: number; cols: number }[] {
  const sorted = [...blocks].sort((a, b) => a.startSlot - b.startSlot || a.endSlot - b.endSlot);
  const result: { block: TimeBlock; col: number; cols: number }[] = [];
  let cluster: TimeBlock[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const colEnds: number[] = [];
    const placed = cluster.map((b) => {
      const visualEnd = Math.max(b.endSlot, b.startSlot + minimumSpan);
      let col = colEnds.findIndex((end) => end <= b.startSlot);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(visualEnd);
      } else {
        colEnds[col] = visualEnd;
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
    clusterEnd = Math.max(clusterEnd, Math.max(b.endSlot, b.startSlot + minimumSpan));
  }
  flush();
  return result;
}
