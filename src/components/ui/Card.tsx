import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        padding ? 'p-5' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, sub, color = 'text-gray-800', icon }: MetricCardProps) {
  return (
    <Card className="flex items-center gap-4">
      {icon && (
        <div className="p-2.5 rounded-lg bg-gray-50 text-gray-500 flex-shrink-0">{icon}</div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate">{label}</p>
        <p className={`text-2xl font-bold ${color} leading-tight`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </Card>
  );
}
