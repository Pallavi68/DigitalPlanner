import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, dayOfMonth, monthName, weekdayShort } from '../../lib/dates';
import { usePlanner } from '../../store/PlannerContext';
import type { HabitPlanItem, ISODate } from '../../types';
import './two-week-habit.css';

function Activity({ item }: { item: HabitPlanItem }) {
  const planner = usePlanner();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  return (
    <div className={`habit-activity is-${item.mark}`}>
      <div className="habit-mark-controls">
        <button type="button" className="habit-check" aria-pressed={item.mark === 'check'} aria-label={`Mark ${item.text} done`} onClick={() => planner.setHabitPlanItemMark(item.id, item.mark === 'check' ? 'blank' : 'check')}>✓</button>
        <button type="button" className="habit-cross" aria-pressed={item.mark === 'cross'} aria-label={`Mark ${item.text} not done`} onClick={() => planner.setHabitPlanItemMark(item.id, item.mark === 'cross' ? 'blank' : 'cross')}>×</button>
      </div>
      {editing ? (
        <input autoFocus value={text} onChange={(event) => setText(event.target.value)} onBlur={() => { if (text.trim()) planner.editHabitPlanItem(item.id, text); setEditing(false); }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
      ) : <button type="button" className="habit-activity-text" onClick={() => setEditing(true)}>{item.text}</button>}
      <button type="button" className="habit-remove" aria-label={`Delete ${item.text}`} onClick={() => planner.deleteHabitPlanItem(item.id)}>⌫</button>
    </div>
  );
}

function Cell({ categoryId, date, items }: { categoryId: string; date: ISODate; items: HabitPlanItem[] }) {
  const planner = usePlanner();
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  return (
    <div className="habit-cell">
      {items.map((item) => <Activity key={item.id} item={item} />)}
      {adding ? <form onSubmit={(event) => { event.preventDefault(); if (planner.addHabitPlanItem(categoryId, date, draft)) { setDraft(''); setAdding(false); } }}>
        <input autoFocus aria-label={`Add activity for ${date}`} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!draft.trim()) setAdding(false); }} placeholder="Write activity" />
      </form> : <button type="button" className="habit-add-item" onClick={() => setAdding(true)} aria-label={`Add another activity for ${date}`}>+</button>}
    </div>
  );
}

export function TwoWeekHabitPage({ start, onPrevious, onNext }: { start: ISODate; onPrevious: () => void; onNext: () => void }) {
  const planner = usePlanner();
  const [categoryDraft, setCategoryDraft] = useState('');
  const [managing, setManaging] = useState(false);
  const categories = [...planner.state.habitCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  const days = Array.from({ length: 14 }, (_, index) => addDays(start, index));
  return (
    <section className="habit-sheet" aria-label={`Two-week habit plan from ${start}`}>
      <header className="habit-sheet-heading">
        <button type="button" onClick={onPrevious} aria-label="Previous two weeks">‹</button>
        <div><p>Two-week habit sheet</p><h1>{dayOfMonth(start)} {monthName(start).slice(0, 3)} – {dayOfMonth(days[13])} {monthName(days[13]).slice(0, 3)}</h1></div>
        <button type="button" onClick={onNext} aria-label="Next two weeks">›</button>
      </header>
      <div className="habit-category-toolbar">
        <button type="button" onClick={() => setManaging((open) => !open)} aria-expanded={managing}>{managing ? 'Done arranging categories' : 'Rename & arrange categories'}</button>
      </div>
      {managing && <section className="habit-category-manager" aria-label="Manage habit categories">
        {categories.map((category, index) => <div key={category.id}>
          <input aria-label={`Rename ${category.label}`} defaultValue={category.label} onBlur={(event) => planner.renameHabitCategory(category.id, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
          <button type="button" disabled={index === 0} onClick={() => planner.moveHabitCategory(category.id, -1)} aria-label={`Move ${category.label} up`}>↑</button>
          <button type="button" disabled={index === categories.length - 1} onClick={() => planner.moveHabitCategory(category.id, 1)} aria-label={`Move ${category.label} down`}>↓</button>
        </div>)}
      </section>}
      {[days.slice(0, 7), days.slice(7)].map((week, weekIndex) => (
        <div className="habit-week" key={week[0]}>
          <div className="habit-week-label">Week {weekIndex + 1}</div>
          <div className="habit-grid habit-grid-head">
            <div>Category</div>
            {week.map((date) => <Link to={`/day/${date}`} key={date}><span>{weekdayShort(date)}</span><strong>{dayOfMonth(date)}</strong></Link>)}
          </div>
          {categories.map((category) => (
            <div className="habit-grid habit-category-row" key={category.id}>
              <div className="habit-category-name">{category.label}</div>
              {week.map((date) => <Cell key={date} categoryId={category.id} date={date} items={planner.state.habitPlanItems.filter((item) => item.categoryId === category.id && item.date === date)} />)}
            </div>
          ))}
        </div>
      ))}
      <form className="habit-add-category" onSubmit={(event) => { event.preventDefault(); if (planner.addHabitCategory(categoryDraft)) setCategoryDraft(''); }}>
        <label htmlFor="habit-category">Add another category</label><input id="habit-category" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="e.g. Self-care" /><button type="submit" disabled={!categoryDraft.trim()}>Add</button>
      </form>
    </section>
  );
}
