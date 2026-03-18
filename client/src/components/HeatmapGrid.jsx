const MONTH_NAMES_SHORT = ['Tam', 'Hel', 'Maa', 'Huh', 'Tou', 'Kes', 'Hei', 'Elo', 'Syy', 'Lok', 'Mar', 'Jou'];

function getColor(km) {
  if (km <= 0) return '#1f2937'; // gray-800
  if (km < 20) return '#14532d'; // green-900
  if (km < 50) return '#166534'; // green-800
  if (km < 100) return '#16a34a'; // green-600
  return '#eab308'; // yellow-500
}

export default function HeatmapGrid({ data, year }) {
  const kmByDate = new Map(data.map(d => [d.date, d.km]));
  const _d = new Date();
  const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;

  // Build week columns
  const jan1 = new Date(year, 0, 1);
  const dow = jan1.getDay() || 7; // Mon=1...Sun=7
  const gridStart = new Date(jan1);
  gridStart.setDate(jan1.getDate() - dow + 1);

  const dec31 = new Date(year, 11, 31);

  const weeks = [];
  const monthLabels = []; // { weekIndex, label }
  let current = new Date(gridStart);
  let weekIdx = 0;
  let lastMonth = -1;

  while (current <= dec31) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
      const inYear = current.getFullYear() === year;
      const km = inYear ? (kmByDate.get(dateStr) || 0) : -1;
      const isToday = dateStr === today;
      week.push({ date: dateStr, km, inYear, isToday });

      // Track month label (use first Mon of each month)
      if (inYear && d === 0 && current.getMonth() !== lastMonth) {
        monthLabels.push({ weekIndex: weekIdx, label: MONTH_NAMES_SHORT[current.getMonth()] });
        lastMonth = current.getMonth();
      }

      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    weekIdx++;
  }

  const cellSize = 11;
  const cellGap = 2;
  const totalW = weeks.length * (cellSize + cellGap);

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalW}
        height={cellSize * 7 + cellGap * 6 + 18}
        className="block"
      >
        {/* Month labels */}
        {monthLabels.map(({ weekIndex, label }) => (
          <text
            key={label}
            x={weekIndex * (cellSize + cellGap)}
            y={12}
            fontSize={9}
            fill="#6b7280"
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        ))}

        {/* Cells */}
        {weeks.map((week, wi) =>
          week.map((day, di) => (
            <rect
              key={day.date}
              x={wi * (cellSize + cellGap)}
              y={18 + di * (cellSize + cellGap)}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={day.inYear ? getColor(day.km) : 'transparent'}
              stroke={day.isToday ? '#22c55e' : 'none'}
              strokeWidth={1.5}
            >
              {day.inYear && (
                <title>{day.date}: {day.km > 0 ? `${day.km.toFixed(1)} km` : 'ei ajoa'}</title>
              )}
            </rect>
          ))
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <span>Vähemmän</span>
        {[0, 10, 30, 70, 120].map((km, i) => (
          <svg key={i} width={11} height={11}>
            <rect width={11} height={11} rx={2} fill={getColor(km)} />
          </svg>
        ))}
        <span>Enemmän (keltainen = 100+ km)</span>
      </div>
    </div>
  );
}
