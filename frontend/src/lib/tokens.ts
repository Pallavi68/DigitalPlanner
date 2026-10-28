/**
 * Design tokens — the single source for colors, type, and motion.
 * Mirrors the component/design-token sheet in the design brief (§2, §8.3).
 * CSS consumes the :root custom properties in index.css; TS reads these.
 */
export const tokens = {
  color: {
    navy: '#1c2140',
    cream: '#f3ebda',
    paper: '#fbf8f1',
    paperEdge: '#efe8d6',
    gold: '#b8985a',
    terracotta: '#c26b4a',
    ink: '#2c3a58',
    inkSoft: '#8a94a8',
    rule: '#c5cfdd',
    ruleFaint: '#e6e2d6',
    ruleHalf: '#e6ebf3',
    check: '#3e7d4e',
    cross: '#b5493a',
    placeholder: '#c2b8a3',
  },
  /** Rainbow day-spine colors, Mon..Sun (header + light tint). */
  days: [
    { h: '#c76b8a', lt: '#eccfd8' },
    { h: '#5a7ab2', lt: '#cdd8ea' },
    { h: '#8a6fae', lt: '#dccfea' },
    { h: '#5f9a63', lt: '#cfe2d0' },
    { h: '#c9a23c', lt: '#ecdfb2' },
    { h: '#c76b8a', lt: '#eccfd8' },
    { h: '#5a7ab2', lt: '#cdd8ea' },
  ],
  /** Time-block source tint (highlighter feel) + bracket color, by SourceTag. */
  source: {
    goodDay: { bg: 'rgba(233,196,90,.30)', edge: '#c9a23c', label: 'Successful Day' },
    todo: { bg: 'rgba(233,196,90,.24)', edge: '#b8985a', label: 'To Dos' },
    routine: { bg: 'rgba(90,122,178,.22)', edge: '#5a7ab2', label: 'Successful Day' },
    chore: { bg: 'rgba(138,111,174,.22)', edge: '#8a6fae', label: 'Chore' },
    fixed: { bg: '#f6efdf', edge: '#1c2140', label: 'Fixed commitment' },
    manual: { bg: 'rgba(120,150,200,.16)', edge: '#8a94a8', label: 'Manual block' },
  },
  font: {
    serif: "'EB Garamond', Georgia, 'Times New Roman', serif",
    hand: "'Patrick Hand', 'Comic Sans MS', cursive",
  },
} as const;

export type SourceTagKey = keyof typeof tokens.source;
