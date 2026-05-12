interface StockBarProps {
  actual: number;
  minimo: number;
  maximo: number;
}

export function StockBar({ actual, minimo, maximo }: StockBarProps) {
  const pct = maximo > 0 ? Math.min((actual / maximo) * 100, 100) : 0;
  const isLow = actual < minimo;
  const isWarning = !isLow && pct < 30;

  const barColor = isLow
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-400'
    : 'bg-[#1D9E75]';

  const minPct = maximo > 0 ? (minimo / maximo) * 100 : 0;

  return (
    <div className="w-full">
      <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
        {/* Línea de mínimo */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-60"
          style={{ left: `${minPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>0</span>
        <span>Mín: {minimo.toLocaleString('es-UY')}</span>
        <span>{maximo.toLocaleString('es-UY')}</span>
      </div>
    </div>
  );
}
