import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const STYLES: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--navy)', color: 'var(--cream)', border: '1px solid var(--navy)' },
  secondary: { background: 'transparent', color: 'var(--navy)', border: '1px solid var(--gold)' },
  ghost: { background: 'transparent', color: 'var(--ink)', border: '1px solid transparent' },
  danger: { background: 'transparent', color: 'var(--cross)', border: '1px solid var(--cross)' },
};

export function PaperButton({ variant = 'primary', style, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        font: "500 14px var(--serif)",
        letterSpacing: '.3px',
        padding: '9px 16px',
        borderRadius: 6,
        minHeight: 44,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 80ms ease, opacity 120ms',
        ...STYLES[variant],
        ...style,
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'translateY(1px)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    />
  );
}
