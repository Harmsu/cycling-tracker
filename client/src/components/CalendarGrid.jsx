const DAY_NAMES = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];

export default function CalendarGrid({ year, month, rideMap, onDayClick }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function getKmStyle(km) {
    if (km < 20) return 'bg-green-300 border-green-400 text-green-900';
    if (km < 50) return 'bg-green-500 border-green-600 text-white';
    if (km < 100) return 'bg-green-700 border-green-800 text-white';
    return 'bg-yellow-300 border-yellow-400 text-yellow-900';
  }

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const data = rideMap.get(dateStr);
          const isToday = dateStr === today;
          const isFuture = dateStr > today;

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onDayClick(dateStr)}
              disabled={isFuture}
              className={`
                relative flex flex-col items-center justify-center rounded-xl
                aspect-square text-sm font-medium border transition-all
                ${isToday ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
                ${data
                  ? `${getKmStyle(data.totalKm)} hover:brightness-95 cursor-pointer`
                  : isFuture
                    ? 'bg-transparent border-transparent text-gray-300 cursor-default'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer'
                }
              `}
            >
              <span className={`text-xs font-bold ${isToday && !data ? 'text-yellow-600' : ''}`}>
                {day}
              </span>
              {data && (
                <span className="text-xs font-bold leading-none">
                  {data.totalKm % 1 === 0 ? data.totalKm : data.totalKm.toFixed(1)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
