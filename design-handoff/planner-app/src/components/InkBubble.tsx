import { useState } from 'react';

interface InkBubbleProps {
  done: boolean;
  onToggle: () => void;
  label: string;
  size?: number;
}

/**
 * Ink-mark bubble checkbox (design brief §2 "Marks"). A real <button> for
 * keyboard + screen-reader support; the filled dot animates with an ink-settle.
 */
export function InkBubble({ done, onToggle, label, size = 16 }: InkBubbleProps) {
  const [pulse, setPulse] = useState(0);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={() => {
        setPulse((p) => p + 1);
        onToggle();
      }}
      style={{
        width: size,
        height: size,
        flex: 'none',
        padding: 0,
        border: '1.5px solid var(--ink)',
        borderRadius: '50% 48% 52% 50%',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,
      }}
    >
      {done && (
        <span
          key={pulse}
          className="ink-mark"
          style={{
            width: size * 0.58,
            height: size * 0.58,
            background: 'var(--ink)',
            borderRadius: '55% 45% 50% 52%',
            transform: 'rotate(8deg)',
          }}
        />
      )}
    </button>
  );
}
