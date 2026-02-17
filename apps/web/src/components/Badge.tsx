import type { ReactNode } from 'react';

type Variant = 'neutral' | 'success' | 'warning' | 'info';

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

export default function Badge({ children, variant = 'neutral', className = '' }: Props) {
  return <span className={`badge badge-${variant}${className ? ` ${className}` : ''}`}>{children}</span>;
}
