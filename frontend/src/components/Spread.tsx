import { useState, type ReactNode } from 'react';
import { useViewport } from '../hooks/useViewport';

interface SpreadProps {
  left: ReactNode;
  right: ReactNode;
  ariaLabel?: string;
  /** Max width of the whole book. */
  maxWidth?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  turnLabel?: string;
}

/**
 * The open book: two paper pages with a center spine and striped cover edge,
 * a stacked single column on phone. Recreates the book chrome from the
 * approved design (navy stripe frame, sheet-stack shadow, spine crease).
 */
export function Spread({
  left,
  right,
  ariaLabel,
  maxWidth = 1120,
  onPrevious,
  onNext,
  previousLabel = 'Previous day',
  nextLabel = 'Next day',
  turnLabel = 'Planner page',
}: SpreadProps) {
  const vp = useViewport();
  const phone = vp === 'phone';
  const [turn, setTurn] = useState<{ direction: 'forward' | 'backward'; fromLabel: string; active: boolean } | null>(null);

  const beginTurn = (direction: 'forward' | 'backward') => {
    if (turn) return;
    const navigate = direction === 'forward' ? onNext : onPrevious;
    if (!navigate) return;
    setTurn({ direction, fromLabel: turnLabel, active: false });
    navigate();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTurn((current) => current ? { ...current, active: true } : current);
      });
    });
  };

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
        alignSelf: 'flex-start',
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
        className="page-spread"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: phone ? 'column' : 'row',
          boxShadow: 'var(--sheet-stack)',
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
        {onPrevious && (
          <>
            <CornerButton corner="top-left" label={previousLabel} direction="previous" onClick={() => beginTurn('backward')} />
            <CornerButton corner="bottom-left" label={previousLabel} direction="previous" onClick={() => beginTurn('backward')} />
          </>
        )}
        {onNext && (
          <>
            <CornerButton corner="top-right" label={nextLabel} direction="next" onClick={() => beginTurn('forward')} />
            <CornerButton corner="bottom-right" label={nextLabel} direction="next" onClick={() => beginTurn('forward')} />
          </>
        )}
        {turn && (
          <div
            className={`turning-leaf ${turn.direction} ${turn.active ? 'active' : ''}`}
            onTransitionEnd={(event) => {
              if (event.target === event.currentTarget) setTurn(null);
            }}
            aria-hidden
          >
            <div className="leaf-face leaf-front">
              <LeafPaper label={turn.direction === 'forward' ? turn.fromLabel : turnLabel} />
            </div>
            <div className="leaf-face leaf-back">
              <LeafPaper label={turn.direction === 'forward' ? turnLabel : turn.fromLabel} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CornerButton({
  corner,
  label,
  direction,
  onClick,
}: {
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  label: string;
  direction: 'previous' | 'next';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`page-corner ${corner}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <span aria-hidden>{direction === 'previous' ? '‹' : '›'}</span>
    </button>
  );
}

function LeafPaper({ label }: { label: string }) {
  return (
    <div className="leaf-paper">
      <span>{label}</span>
      <div />
    </div>
  );
}
