import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface AlertItem {
  label: string;
  dias: number;
}

interface AlertBannerProps {
  items: AlertItem[];
}

export function AlertBanner({ items }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || items.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
      <AlertTriangle size={20} className="text-[#BA7517] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 mb-1">
          {items.length} pago{items.length > 1 ? 's' : ''} próximo{items.length > 1 ? 's' : ''} a vencer
        </p>
        <ul className="space-y-0.5">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-amber-700 flex gap-2">
              <span className="font-medium">{item.label}</span>
              <span>—</span>
              <span className={item.dias <= 0 ? 'text-red-600 font-semibold' : ''}>
                {item.dias === 0
                  ? 'Vence hoy'
                  : item.dias < 0
                  ? `Vencido hace ${Math.abs(item.dias)} días`
                  : `Vence en ${item.dias} día${item.dias !== 1 ? 's' : ''}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400 hover:text-amber-600 flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
