import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SyncIndicator } from './SyncIndicator';
import { useViewport } from '../hooks/useViewport';
import { addDays, dayOfMonth, fromISO, monthName, monthWeeks, todayISO, weekday, weekdayShort } from '../lib/dates';

function routeDate(pathname: string): string {
  const dayMatch = pathname.match(/^\/day\/(\d{4}-\d{2}-\d{2})/);
  if (dayMatch?.[1]) return dayMatch[1];
  const weekMatch = pathname.match(/^\/week\/(\d{4}-\d{2}-\d{2})/);
  if (weekMatch?.[1]) return weekMatch[1];
  const habitMatch = pathname.match(/^\/habits\/(\d{4}-\d{2}-\d{2})/);
  if (habitMatch?.[1]) return habitMatch[1];
  const monthMatch = pathname.match(/^\/month\/(\d{4})\/(\d{1,2})/);
  if (monthMatch) return `${monthMatch[1]}-${monthMatch[2].padStart(2, '0')}-01`;
  return todayISO();
}

function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monthName(monday) === monthName(sunday);
  return sameMonth
    ? `${dayOfMonth(monday)}–${dayOfMonth(sunday)} ${monthName(monday).slice(0, 3)}`
    : `${dayOfMonth(monday)} ${monthName(monday).slice(0, 3)}–${dayOfMonth(sunday)} ${monthName(sunday).slice(0, 3)}`;
}

export function BookShell({ children }: { children: ReactNode }) {
  const vp = useViewport();
  const loc = useLocation();
  const phone = vp === 'phone';
  const selectedDate = routeDate(loc.pathname);
  const selectedMonday = addDays(selectedDate, -weekday(selectedDate));
  const weeks = monthWeeks(selectedDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(selectedMonday, index));
  const selected = fromISO(selectedDate);
  const year = selected.getFullYear();
  const month = selected.getMonth() + 1;
  const dailyRoute = loc.pathname.startsWith('/day/');
  const weeklyRoute = loc.pathname.startsWith('/week/');
  const habitRoute = loc.pathname.startsWith('/habits/');

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: '#d9d3c6' }}>
      {/* Top chrome: brand + sync + tabs, on the navy cover spine */}
      <header
        className="book-header"
        style={{
          background: 'var(--navy)',
          color: 'var(--cream)',
          padding: phone ? '4px 10px 0' : '5px 18px 0',
          boxShadow: '0 2px 12px rgba(28,33,64,.35)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div className="book-header-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
            <span style={{ font: `600 ${phone ? 18 : 22}px var(--serif)`, fontStyle: 'italic' }}>
              {monthName(selectedDate)}
            </span>
            <Link
              to={`/month/${year}/${month}`}
              className="year-overview-link"
              aria-label={`Open ${monthName(selectedDate)} ${year} month view`}
              title="Open month view"
            >
              {year}
            </Link>
          </div>
          <div className="book-header-actions">
            {dailyRoute && (
              <Link
                to={`/week/${selectedMonday}`}
                className="plan-week-link"
                aria-label={`Plan the week of ${weekLabel(selectedMonday)}`}
              >
                Plan week
              </Link>
            )}
            <SyncIndicator />
          </div>
        </div>

        {dailyRoute && (
          <nav aria-label="Choose week and day" className="calendar-tabs">
            <div className="week-tabs">
              {weeks.map((week, index) => {
                const monday = week[0];
                const inMonthTarget = week.find((date) => date.slice(0, 7) === selectedDate.slice(0, 7)) ?? monday;
                return (
                  <Link
                    key={monday}
                    to={`/day/${inMonthTarget}`}
                    className={monday === selectedMonday ? 'week-tab active' : 'week-tab'}
                    aria-current={monday === selectedMonday ? 'page' : undefined}
                  >
                    <span>Week {index + 1}</span>
                    <small>{weekLabel(monday)}</small>
                  </Link>
                );
              })}
            </div>
            <div className="day-tabs">
              {days.map((date) => (
                <Link
                  key={date}
                  to={`/day/${date}`}
                  className={date === selectedDate ? 'day-tab active' : 'day-tab'}
                  aria-current={date === selectedDate ? 'date' : undefined}
                  aria-label={`${weekdayShort(date)}, ${monthName(date)} ${dayOfMonth(date)}`}
                >
                  <span>{weekdayShort(date)}</span>
                  <strong>{dayOfMonth(date)}</strong>
                </Link>
              ))}
            </div>
          </nav>
        )}
        {weeklyRoute && (
          <nav aria-label="Current weekly planner" className="calendar-tabs">
            <div className="week-tabs">
              <Link to={`/week/${selectedMonday}`} className="week-tab active" aria-current="page">
                <span>Weekly planner</span>
                <small>{weekLabel(selectedMonday)}</small>
              </Link>
            </div>
          </nav>
        )}
        {habitRoute && (
          <nav aria-label="Current two-week habit sheet" className="calendar-tabs">
            <div className="week-tabs"><Link to={loc.pathname} className="week-tab active" aria-current="page"><span>Habit sheet</span><small>Two-week view</small></Link></div>
          </nav>
        )}
      </header>

      {/* Book body */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: phone ? '8px 8px 32px' : '12px 16px 42px',
        }}
      >
        {children}
      </main>
    </div>
  );
}
