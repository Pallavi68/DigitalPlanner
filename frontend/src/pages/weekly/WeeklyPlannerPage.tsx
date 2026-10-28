import { useMemo, useState, type DragEvent, type PointerEvent } from 'react';
import { InkBubble } from '../../components/InkBubble';
import { Modal } from '../../components/Modal';
import { Spread } from '../../components/Spread';
import { useToast } from '../../components/Toast';
import { addDays, dayOfMonth, fromISO, monthName, weekdayLong, weekdayShort } from '../../lib/dates';
import { usePlanner } from '../../store/PlannerContext';
import type { ISODate, WeeklyAction } from '../../types';
import './weekly-planner.css';

export interface WeeklyPlannerPageProps {
  /** Monday ISO date. Invalid route input should be normalized by the route owner. */
  weekStart: ISODate;
  onPrevious: () => void;
  onNext: () => void;
  onOpenDay: (date: ISODate) => void;
}

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export function WeeklyPlannerPage({ weekStart, onPrevious, onNext, onOpenDay }: WeeklyPlannerPageProps) {
  const planner = usePlanner();
  const toast = useToast();
  const actions = planner.getWeeklyActions(weekStart);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const [draft, setDraft] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [editing, setEditing] = useState<WeeklyAction | null>(null);
  const [editText, setEditText] = useState('');
  const [assigning, setAssigning] = useState<WeeklyAction | null>(null);
  const [deleting, setDeleting] = useState<WeeklyAction | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropDate, setDropDate] = useState<ISODate | null>(null);

  const assign = (actionId: string, date: ISODate) => {
    const action = actions.find((item) => item.id === actionId);
    if (!action || action.assignedDate === date) return;
    if (planner.assignWeeklyAction(actionId, date)) {
      toast('success', `${action.assignedDate ? 'Moved' : 'Assigned'} to ${weekdayLong(date)}.`);
    }
  };

  const finishPointerDrag = (event: PointerEvent<HTMLElement>, actionId: string) => {
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-weekly-drop-date]');
    const date = target?.dataset.weeklyDropDate;
    if (date) assign(actionId, date);
    setDraggingId(null);
    setDropDate(null);
  };

  const weekEnd = dates[6];
  const rangeLabel = `${DATE_FORMAT.format(fromISO(weekStart))} – ${DATE_FORMAT.format(fromISO(weekEnd))}`;
  const scheduledCount = actions.filter((action) => action.assignedDate).length;

  return (
    <>
    <Spread
      ariaLabel={`Weekly plan, ${rangeLabel}`}
      maxWidth={1260}
      onPrevious={onPrevious}
      onNext={onNext}
      previousLabel="Previous week"
      nextLabel="Next week"
      turnLabel={rangeLabel}
      left={(
        <section className="weekly-source-page">
          <header className="weekly-heading">
            <p>Weekly plan</p>
            <h1>{monthName(weekStart)}</h1>
            <span>{rangeLabel}</span>
          </header>

          <form className="weekly-capture" onSubmit={(event) => {
            event.preventDefault();
            if (planner.createWeeklyAction(weekStart, draft)) setDraft('');
          }}>
            <label htmlFor="weekly-action-draft">Actions for the week</label>
            <div>
              <input id="weekly-action-draft" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write an action…" />
              <button type="submit" disabled={!draft.trim()}>Add</button>
            </div>
            <button className="weekly-text-button" type="button" onClick={() => setPasteOpen(true)}>Paste a list</button>
          </form>

          <div className="weekly-list-summary" aria-live="polite">
            <span>{actions.length} action{actions.length === 1 ? '' : 's'}</span>
            <span>{scheduledCount} slotted</span>
          </div>

          <ol className="weekly-action-list">
            {actions.map((action) => (
              <li
                key={action.id}
                className={`weekly-action-row${action.done ? ' is-done' : ''}${draggingId === action.id ? ' is-dragging' : ''}`}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/x-weekly-action', action.id);
                  setDraggingId(action.id);
                }}
                onDragEnd={() => { setDraggingId(null); setDropDate(null); }}
              >
                <InkBubble done={action.done} onToggle={() => planner.toggleWeeklyAction(action.id)} label={`${action.done ? 'Mark incomplete' : 'Complete'} ${action.text}`} size={19} />
                <div className="weekly-action-copy">
                  <span>{action.text}</span>
                  <small>{action.assignedDate ? `${weekdayShort(action.assignedDate)} · ${DATE_FORMAT.format(fromISO(action.assignedDate))}` : 'Not slotted yet'}</small>
                </div>
                <div className="weekly-row-actions">
                  <button
                    type="button"
                    className="weekly-touch-drag"
                    aria-label={`Drag ${action.text} to another day`}
                    title="Drag to a day"
                    onPointerDown={(event) => {
                      if (event.pointerType === 'mouse') return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDraggingId(action.id);
                    }}
                    onPointerMove={(event) => {
                      if (draggingId !== action.id) return;
                      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-weekly-drop-date]');
                      setDropDate((target?.dataset.weeklyDropDate as ISODate | undefined) ?? null);
                    }}
                    onPointerUp={(event) => finishPointerDrag(event, action.id)}
                    onPointerCancel={() => { setDraggingId(null); setDropDate(null); }}
                  >⠿</button>
                  <button type="button" onClick={() => { setAssigning(action); }}> {action.assignedDate ? 'Move' : 'Assign'} </button>
                  <button type="button" aria-label={`Edit ${action.text}`} onClick={() => { setEditing(action); setEditText(action.text); }}>Edit</button>
                  <button type="button" aria-label={`Delete ${action.text}`} onClick={() => action.assignedDate ? setDeleting(action) : planner.deleteWeeklyAction(action.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ol>
          {!actions.length && <p className="weekly-empty">Begin with the things you want to move forward this week.</p>}
          <p className="weekly-drag-note">Drag an action onto a day, or use Assign. Touch and keyboard always have the same controls.</p>
        </section>
      )}
      right={(
        <section className="weekly-days-page" aria-label="Days of this week">
          <header className="weekly-days-heading">
            <p>At a glance</p>
            <span>Drop actions onto a day</span>
          </header>
          <div className="weekly-day-list">
            {dates.map((date) => {
              const dayActions = actions.filter((action) => action.assignedDate === date);
              return (
                <section
                  key={date}
                  className={`weekly-day${dropDate === date ? ' is-drop-target' : ''}`}
                  data-weekly-drop-date={date}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropDate(date); }}
                  onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropDate(null); }}
                  onDrop={(event: DragEvent<HTMLElement>) => {
                    event.preventDefault();
                    const actionId = event.dataTransfer.getData('text/x-weekly-action');
                    if (actionId) assign(actionId, date);
                    setDraggingId(null);
                    setDropDate(null);
                  }}
                >
                  <header>
                    <button type="button" onClick={() => onOpenDay(date)} aria-label={`Open ${weekdayLong(date)}, ${DATE_FORMAT.format(fromISO(date))}`}>
                      <span>{weekdayLong(date)}</span>
                      <strong>{dayOfMonth(date)}</strong>
                    </button>
                    <small>{dayActions.length ? `${dayActions.length} action${dayActions.length === 1 ? '' : 's'}` : 'Open'}</small>
                  </header>
                  {dayActions.length ? (
                    <ul>{dayActions.map((action) => <li key={action.id} className={action.done ? 'is-done' : ''}><span aria-hidden>{action.done ? '✓' : '○'}</span>{action.text}</li>)}</ul>
                  ) : <p>Drop an action here</p>}
                </section>
              );
            })}
          </div>
        </section>
      )}
    />
      <Modal open={pasteOpen} onClose={() => setPasteOpen(false)} title="Paste actions for the week">
        <form className="weekly-dialog" onSubmit={(event) => {
          event.preventDefault();
          const count = planner.pasteWeeklyActions(weekStart, pasteText);
          if (count) {
            toast('success', `Added ${count} action${count === 1 ? '' : 's'}.`);
            setPasteText('');
            setPasteOpen(false);
          }
        }}>
          <label htmlFor="weekly-paste">Put each action on its own line.</label>
          <textarea id="weekly-paste" data-autofocus rows={9} value={pasteText} onChange={(event) => setPasteText(event.target.value)} />
          <div><button type="button" onClick={() => setPasteOpen(false)}>Cancel</button><button type="submit" disabled={!pasteText.trim()}>Add actions</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit weekly action">
        <form className="weekly-dialog" onSubmit={(event) => {
          event.preventDefault();
          if (editing && planner.editWeeklyAction(editing.id, editText)) setEditing(null);
        }}>
          <label htmlFor="weekly-edit">Action</label>
          <input id="weekly-edit" data-autofocus value={editText} onChange={(event) => setEditText(event.target.value)} />
          <div><button type="button" onClick={() => setEditing(null)}>Cancel</button><button type="submit" disabled={!editText.trim()}>Save</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(assigning)} onClose={() => setAssigning(null)} title={assigning?.assignedDate ? 'Move action' : 'Assign action'}>
        <div className="weekly-dialog">
          <p>{assigning?.text}</p>
          <div className="weekly-date-picker">
            {dates.map((date) => (
              <button
                key={date}
                type="button"
                data-autofocus={assigning?.assignedDate === date || undefined}
                aria-pressed={assigning?.assignedDate === date}
                onClick={() => {
                  if (assigning) assign(assigning.id, date);
                  setAssigning(null);
                }}
              >
                <span>{weekdayShort(date)}</span><strong>{dayOfMonth(date)}</strong>
              </button>
            ))}
          </div>
          <div><button type="button" onClick={() => setAssigning(null)}>Cancel</button></div>
        </div>
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete scheduled action?">
        <div className="weekly-dialog">
          <p>Deleting “{deleting?.text}” also removes its linked item from {deleting?.assignedDate ? weekdayLong(deleting.assignedDate) : 'the Daily Page'}.</p>
          <div><button type="button" onClick={() => setDeleting(null)}>Keep it</button><button className="weekly-danger" type="button" onClick={() => { if (deleting) planner.deleteWeeklyAction(deleting.id); setDeleting(null); }}>Delete action</button></div>
        </div>
      </Modal>
    </>
  );
}
