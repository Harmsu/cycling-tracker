import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import CalendarGrid from '../components/CalendarGrid';
import RideForm from '../components/RideForm';

const MONTH_NAMES = [
  'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu',
  'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu',
];

export default function CalendarView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [rideMap, setRideMap] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(null);
  const [dayRides, setDayRides] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingRide, setEditingRide] = useState(null);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const { rides } = await api.getRides({ month: monthStr, limit: 200 });
      const map = new Map();
      for (const r of rides) {
        if (!map.has(r.date)) map.set(r.date, { rides: [], totalKm: 0 });
        const entry = map.get(r.date);
        entry.rides.push(r);
        entry.totalKm += r.km;
      }
      setRideMap(map);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  const fetchDay = useCallback(async (date) => {
    if (!date) return;
    setDayLoading(true);
    try {
      const { rides } = await api.getRides({ date, limit: 50 });
      setDayRides(rides);
    } catch {
      setDayRides([]);
    } finally {
      setDayLoading(false);
    }
  }, []);

  function handleDayClick(date) {
    setSelectedDate(date);
    fetchDay(date);
    setShowForm(false);
    setEditingRide(null);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function handleSave(data) {
    if (editingRide) {
      await api.updateRide(editingRide.id, data);
    } else {
      await api.createRide(data);
    }
    setShowForm(false);
    setEditingRide(null);
    await fetchMonth();
    if (selectedDate) await fetchDay(selectedDate);
  }

  async function handleDelete(id) {
    if (!confirm('Poistetaanko ajo?')) return;
    await api.deleteRide(id);
    await fetchMonth();
    if (selectedDate) await fetchDay(selectedDate);
  }

  const _td = new Date();
  const todayStr = `${_td.getFullYear()}-${String(_td.getMonth()+1).padStart(2,'0')}-${String(_td.getDate()).padStart(2,'0')}`;

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Calendar panel */}
      <div className="flex-1 p-4 md:p-6 max-w-lg mx-auto w-full md:max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">
              {MONTH_NAMES[month]} {year}
            </h1>
            {loading && <p className="text-xs text-gray-400">Ladataan...</p>}
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        {/* Year selector */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button onClick={() => setYear(y => y - 1)} className="text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded">
            ‹ {year - 1}
          </button>
          <span className="text-green-700 font-semibold text-sm">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded">
            {year + 1} ›
          </button>
        </div>

        <CalendarGrid
          year={year}
          month={month}
          rideMap={rideMap}
          onDayClick={handleDayClick}
        />

        <div className="mt-5 flex justify-center">
          <button
            onClick={() => {
              setSelectedDate(todayStr);
              setEditingRide(null);
              setShowForm(true);
              fetchDay(todayStr);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Lisää tänään
          </button>
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div className="border-t md:border-t-0 md:border-l border-gray-200 md:w-80 flex-shrink-0 bg-white">
          <div className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {(() => {
                    const [y, m, d] = selectedDate.split('-');
                    const weekday = new Date(selectedDate + 'T12:00:00').toLocaleDateString('fi-FI', { weekday: 'long' });
                    return `${weekday} ${d}.${m}.${y}`;
                  })()}
                </h2>
                {dayRides.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Yhteensä: {dayRides.reduce((s, r) => s + r.km, 0).toFixed(1)} km
                  </p>
                )}
              </div>
              <button
                onClick={() => { setSelectedDate(null); setShowForm(false); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {dayLoading ? (
              <p className="text-gray-400 text-sm">Ladataan...</p>
            ) : dayRides.length === 0 ? (
              <p className="text-gray-400 text-sm mb-4">Ei ajoja tälle päivälle</p>
            ) : (
              <div className="space-y-2 mb-4">
                {dayRides.map(ride => (
                  <div key={ride.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-green-700 text-lg leading-none">
                          {ride.km % 1 === 0 ? ride.km : ride.km.toFixed(1)} km
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{ride.bike}</p>
                        {ride.route && <p className="text-xs text-gray-600 mt-0.5">{ride.route}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingRide(ride); setShowForm(true); }}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(ride.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
                            <path d="M10,11v6M14,11v6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => { setEditingRide(null); setShowForm(true); }}
              className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 text-sm font-medium transition-colors"
            >
              + Lisää ajo tälle päivälle
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <RideForm
          date={selectedDate}
          ride={editingRide}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingRide(null); }}
        />
      )}
    </div>
  );
}
