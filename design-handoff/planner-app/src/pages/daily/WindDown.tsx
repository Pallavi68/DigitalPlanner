import { useState } from 'react';
import type { DayState, ISODate } from '../../types';
import { InkBubble } from '../../components/InkBubble';
import { SectionLabel } from '../../components/ui';

interface Props {
  date: ISODate;
  day: DayState;
  onToggleItem: (id: string) => void;
  onField: (field: 'tomorrowPlan' | 'bedtime', value: string) => void;
}

/** Zone 4 — evening wind-down: mini checklist + tomorrow plan + bedtime (FR-6). */
export function WindDown({ day, onToggleItem, onField }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 22, borderTop: '1px solid var(--gold)', paddingTop: 12 }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          padding: 0,
          minHeight: 32,
        }}
      >
        <span style={{ font: "600 12px var(--serif)", letterSpacing: '2.5px', color: 'var(--navy)', textTransform: 'uppercase' }}>Wind-down</span>
        <span aria-hidden style={{ font: "600 16px var(--serif)", color: 'var(--ink-soft)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}>⌄</span>
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginBottom: 12 }}>
            {day.windDown.checklist.map((item) => (
              <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <InkBubble done={item.done} onToggle={() => onToggleItem(item.id)} label={item.label} size={13} />
                <span style={{ font: "15px var(--hand)", color: 'var(--ink)' }}>{item.label}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 30, borderBottom: '1px solid var(--rule)' }}>
            <span style={{ font: "500 11px var(--serif)", letterSpacing: '1px', color: 'var(--ink-soft)', flex: 'none' }}>Tomorrow</span>
            <input
              className="hand-input"
              style={{ font: "16px var(--hand)" }}
              value={day.windDown.tomorrowPlan}
              placeholder="one line to set up tomorrow…"
              onChange={(e) => onField('tomorrowPlan', e.target.value)}
              aria-label="Tomorrow plan"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 30, borderBottom: '1px solid var(--rule)' }}>
            <span style={{ font: "500 11px var(--serif)", letterSpacing: '1px', color: 'var(--ink-soft)', flex: 'none' }}>Lights out</span>
            <input
              className="hand-input"
              style={{ font: "16px var(--hand)" }}
              value={day.windDown.bedtime}
              placeholder="e.g. 12:30"
              onChange={(e) => onField('bedtime', e.target.value)}
              aria-label="Bedtime"
            />
          </div>
        </div>
      )}
    </div>
  );
}
