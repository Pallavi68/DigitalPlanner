import { type ReactNode } from 'react';
import { useViewport } from '../hooks/useViewport';

interface SpreadProps {
  left: ReactNode;
  right: ReactNode;
  /** Changing this key replays the page-turn animation (FR-1). */
  flipKey?: string;
  ariaLabel?: string;
  /** Max width of the whole book. */
  maxWidth?: number;
}

/**
 * The open book: two paper pages with a center spine and striped cover edge,
 * a stacked single column on phone. Recreates the book chrome from the
 * approved design (navy stripe frame, sheet-stack shadow, spine crease).
 */
export function Spread({ left, right, flipKey, ariaLabel, maxWidth = 1120 }: SpreadProps) {
  const vp = useViewport();
  const phone = vp === 'phone';

  const page: React.CSSProperties = {
    background: 'var(--paper)',
    padding: phone ? '22px 18px' : '30px 30px',
    flex: 1,
    minWidth: 0,
  };

  return (
    <section
      aria-label={ariaLabel}
      style={{
        width: '100%',
        maxWidth,
        borderRadius: 8,
        padding: phone ? '10px 10px 14px' : '13px 15px 17px',
        background: 'repeating-linear-gradient(90deg,#1c2140 0px,#1c2140 38px,#f3ebda 38px,#f3ebda 49px)',
        boxShadow: '0 16px 38px rgba(28,33,64,.26)',
        position: 'relative',
      }}
    >
      {/* terracotta ribbon */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: phone ? 40 : 150,
          bottom: -22,
          width: 20,
          height: 54,
          background: 'linear-gradient(180deg,#b25f40,#c26b4a)',
          clipPath: 'polygon(0 0,100% 0,100% 100%,50% 86%,0 100%)',
          boxShadow: '2px 3px 6px rgba(28,33,64,.3)',
        }}
      />
      <div
        key={flipKey}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: phone ? 'column' : 'row',
          boxShadow: 'var(--sheet-stack)',
          transformOrigin: 'left center',
          animation: flipKey ? 'page-turn 420ms cubic-bezier(.36,.1,.2,1)' : undefined,
        }}
      >
        <div
          style={{
            ...page,
            backgroundImage: phone ? undefined : 'linear-gradient(90deg,rgba(28,33,64,0) 82%,rgba(28,33,64,.07))',
          }}
        >
          {left}
        </div>

        {!phone && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 64,
              transform: 'translateX(-50%)',
              background: 'var(--spine)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        )}
        {phone && <div aria-hidden style={{ height: 1, background: 'var(--rule-faint)' }} />}

        <div
          style={{
            ...page,
            backgroundImage: phone ? undefined : 'linear-gradient(90deg,rgba(28,33,64,.07),rgba(28,33,64,0) 18%)',
          }}
        >
          {right}
        </div>
      </div>
    </section>
  );
}
