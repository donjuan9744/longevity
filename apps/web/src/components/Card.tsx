import type { CSSProperties, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  accentColor?: string;
  compact?: boolean;
};

export default function Card({ children, className = '', accentColor, compact = false }: Props) {
  const style = accentColor ? ({ ['--accent-color' as string]: accentColor } as CSSProperties) : undefined;

  return (
    <section className={`card${compact ? ' card-compact' : ''}${accentColor ? ' card-accent' : ''}${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </section>
  );
}
