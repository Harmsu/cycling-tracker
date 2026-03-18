const MONTH_NAMES = ['Tammi', 'Helmi', 'Maalis', 'Huhti', 'Touko', 'Kesä', 'Heinä', 'Elo', 'Syys', 'Loka', 'Marras', 'Joulu'];

export default function BarChart({ data }) {
  const maxKm = Math.max(...data.map(d => d.km), 1);
  const currentMonth = new Date().getMonth();

  return (
    <div className="w-full">
      <div className="flex items-end gap-1 h-36">
        {data.map((d, i) => {
          const pct = (d.km / maxKm) * 100;
          const isCurrent = i === currentMonth;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              {d.km > 0 && (
                <span className="text-xs text-green-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {Math.round(d.km)}
                </span>
              )}
              <div className="w-full flex items-end" style={{ height: '112px' }}>
                <div
                  className={`w-full rounded-t transition-all ${
                    isCurrent ? 'bg-yellow-400' : d.km > 0 ? 'bg-green-500' : 'bg-gray-100'
                  }`}
                  style={{
                    height: d.km > 0 ? `${Math.max(pct, 2)}%` : '4px',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {MONTH_NAMES.map((m, i) => {
          const isCurrent = i === currentMonth;
          return (
            <div
              key={i}
              className={`flex-1 text-center text-xs ${isCurrent ? 'text-yellow-600 font-semibold' : 'text-gray-400'}`}
            >
              {m.slice(0, 3)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
