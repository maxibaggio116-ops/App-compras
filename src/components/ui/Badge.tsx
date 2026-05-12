import React from 'react';

type Color = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'purple';

const colorClasses: Record<Color, string> = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
  purple: 'bg-purple-100 text-purple-800',
};

interface BadgeProps {
  color?: Color;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ color = 'gray', children, className = '', dot }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        colorClasses[color],
        className,
      ].join(' ')}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-80`} />
      )}
      {children}
    </span>
  );
}

export function estadoBadge(estado: string) {
  const map: Record<string, { color: 'green' | 'blue' | 'amber' | 'red' | 'gray'; label: string }> = {
    pendiente: { color: 'amber', label: 'Pendiente' },
    aprobada: { color: 'green', label: 'Aprobada' },
    rechazada: { color: 'red', label: 'Rechazada' },
    comprada: { color: 'blue', label: 'Comprada' },
    pagado: { color: 'green', label: 'Pagado' },
    vencido: { color: 'red', label: 'Vencido' },
  };
  const cfg = map[estado] ?? { color: 'gray' as const, label: estado };
  return <Badge color={cfg.color} dot>{cfg.label}</Badge>;
}
