import React from 'react';
import { PackageSearch } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'Sin resultados',
  description = 'No hay datos para mostrar.',
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4 text-gray-400">
        {icon ?? <PackageSearch size={40} />}
      </div>
      <h3 className="text-base font-semibold text-gray-600 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}
