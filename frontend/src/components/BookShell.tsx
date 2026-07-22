import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SyncIndicator } from './SyncIndicator';
import { useViewport } from '../hooks/useViewport';
import { todayISO, monthName, fromISO } from '../lib/dates';

const TABS = [
  { to: `/day/${todayISO()}`, label: 'Daily', match: '/day', color: '#c26b4a' },
];

export function BookShell({ children }: { children: ReactNode }) {
  const vp = useViewport();
  const loc = useLocation();
  const phone = vp === 'phone';
  const year = fromISO(todayISO()).getFullYear();

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: '#d9d3c6' }}>
      {/* Top chrome: brand + sync + tabs, on the navy cover spine */}
      <header
        style={{
          background: 'var(--navy)',
          color: 'var(--cream)',
          padding: phone ? '10px 14px 0' : '14px 26px 0',
          boxShadow: '0 2px 12px rgba(28,33,64,.35)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
            <span style={{ font: `600 ${phone ? 18 : 22}px var(--serif)`, fontStyle: 'italic' }}>{monthName(todayISO())}</span>
            <span style={{ font: "500 10px var(--serif)", letterSpacing: '4px', opacity: 0.7 }}>{year}</span>
          </div>
          <SyncIndicator />
        </div>

        {/* Ribbon tabs */}
        <nav aria-label="Planner pages" style={{ display: 'flex', gap: phone ? 4 : 8, marginTop: phone ? 8 : 12, overflowX: 'auto' }} className="paper-scroll">
          {TABS.map((tab) => {
            const active = loc.pathname.startsWith(tab.match);
            return (
              <NavLink
                key={tab.label}
                to={tab.to}
                style={{
                  textDecoration: 'none',
                  font: `600 ${phone ? 12 : 13}px var(--serif)`,
                  letterSpacing: '.5px',
                  padding: phone ? '8px 12px' : '9px 18px',
                  borderRadius: '7px 7px 0 0',
                  whiteSpace: 'nowrap',
                  minHeight: 40,
                  display: 'flex',
                  alignItems: 'center',
                  color: active ? 'var(--navy)' : 'rgba(243,235,218,.82)',
                  background: active ? 'var(--paper)' : 'rgba(243,235,218,.12)',
                  borderTop: `3px solid ${tab.color}`,
                }}
              >
                {tab.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      {/* Book body */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: phone ? '14px 8px 40px' : '26px 20px 56px',
        }}
      >
        {children}
      </main>
    </div>
  );
}
