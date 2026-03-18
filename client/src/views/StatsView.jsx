import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';
import HeatmapGrid from '../components/HeatmapGrid';
import GoalBar from '../components/GoalBar';

export default function StatsView() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [records, setRecords] = useState(null);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, mon, heat, rec, gl] = await Promise.all([
        api.getStatsSummary(year),
        api.getMonthlyStats(year),
        api.getHeatmap(year),
        api.getRecords(),
        api.getGoal(year),
      ]);
      setSummary(sum);
      setMonthly(mon);
      setHeatmap(heat);
      setRecords(rec);
      setGoal(gl);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function fmt(val) {
    if (val == null) return '—';
    return typeof val === 'number' ? val.toLocaleString('fi-FI', { maximumFractionDigits: 1 }) : val;
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  }

  const availableYears = [];
  for (let y = currentYear; y >= currentYear - 10; y--) availableYears.push(y);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tilastot</h1>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 text-sm focus:outline-none focus:border-yellow-500"
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Ladataan...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Tänään" value={summary?.today ?? 0} accent />
            <StatCard label="Tällä viikolla" value={summary?.week ?? 0} />
            <StatCard label="Tässä kuussa" value={summary?.month ?? 0} />
            <StatCard label={`Vuosi ${year}`} value={summary?.yearTotal ?? 0} />
            <StatCard label="Kaikki yhteensä" value={summary?.allTime ?? 0} />
            <StatCard label={`Ajoja ${year}`} value={summary?.yearRides ?? 0} unit="kpl" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Keskiarvot
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Ajopäiviä / viikko"
                value={summary?.avgDaysPerWeek ?? 0}
                unit="pv"
                small
              />
              <StatCard
                label="Ajopäiviä / kuukausi"
                value={summary?.avgDaysPerMonth ?? 0}
                unit="pv"
                small
              />
              <StatCard
                label={`Ajopäiviä ${year}`}
                value={summary?.activeDaysYear ?? 0}
                unit="pv"
                small
              />
              <StatCard
                label="Keskimatka / ajopäivä"
                value={summary?.avgKmPerDay ?? 0}
                unit="km"
                small
              />
            </div>
          </div>

          {goal && (
            <GoalBar
              year={year}
              goalKm={goal.goalKm}
              currentKm={goal.currentKm}
              onUpdate={fetchAll}
            />
          )}

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Kuukausittain {year}
            </h2>
            <BarChart data={monthly} />
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Ajopäivät {year}
            </h2>
            <HeatmapGrid data={heatmap} year={year} />
          </div>

          {records && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Henkilökohtaiset ennätykset
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pisin ajo', value: records.longestRide?.km, unit: 'km', sub: fmtDate(records.longestRide?.date) },
                  { label: 'Paras kuukausi', value: records.longestMonth?.km, unit: 'km', sub: records.longestMonth?.month },
                  { label: 'Paras viikko', value: records.longestWeek?.km, unit: 'km', sub: records.longestWeek?.week },
                  { label: 'Paras vuosi', value: records.longestYear?.km, unit: 'km', sub: records.longestYear?.year },
                  { label: 'Nykyinen sarja', value: records.currentStreak, unit: 'pv', sub: null },
                  { label: 'Pisin sarja', value: records.longestStreak, unit: 'pv', sub: null },
                ].map(({ label, value, unit, sub }) => (
                  <div key={label} className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {fmt(value)}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
                    </p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
