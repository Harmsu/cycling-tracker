import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import RideForm from '../components/RideForm';
import CsvImportModal from '../components/CsvImportModal';

const LIMIT = 50;

export default function HistoryView() {
  const currentYear = new Date().getFullYear();
  const [rides, setRides] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterBike, setFilterBike] = useState('');
  const [bikes, setBikes] = useState([]);

  const [editingRide, setEditingRide] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const fetchBikes = useCallback(async () => {
    try { setBikes(await api.getBikes()); } catch { /* ignore */ }
  }, []);

  const fetchRides = useCallback(async (newOffset = 0) => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset: newOffset };
      if (filterYear && !filterMonth) params.year = filterYear;
      if (filterMonth) params.month = `${filterYear || currentYear}-${filterMonth}`;
      if (filterBike) params.bike = filterBike;
      const { rides: data, total: t } = await api.getRides(params);
      setRides(data);
      setTotal(t);
      setOffset(newOffset);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filterYear, filterMonth, filterBike, currentYear]);

  useEffect(() => { fetchBikes(); }, [fetchBikes]);
  useEffect(() => { fetchRides(0); }, [fetchRides]);

  async function handleDelete(id) {
    if (!confirm('Poistetaanko ajo?')) return;
    await api.deleteRide(id);
    fetchRides(offset);
  }

  async function handleSave(data) {
    await api.updateRide(editingRide.id, data);
    setEditingRide(null);
    fetchRides(offset);
    fetchBikes();
  }

  function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const weekday = new Date(dateStr + 'T12:00:00').toLocaleDateString('fi-FI', { weekday: 'short' });
    return `${weekday} ${d}.${m}.${y}`;
  }

  const years = [];
  for (let y = currentYear; y >= currentYear - 10; y--) years.push(y);

  const months = [
    ['01', 'Tammikuu'], ['02', 'Helmikuu'], ['03', 'Maaliskuu'], ['04', 'Huhtikuu'],
    ['05', 'Toukokuu'], ['06', 'Kesäkuu'], ['07', 'Heinäkuu'], ['08', 'Elokuu'],
    ['09', 'Syyskuu'], ['10', 'Lokakuu'], ['11', 'Marraskuu'], ['12', 'Joulukuu'],
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Historia</h1>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Tuo CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <select
          value={filterYear}
          onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); }}
          className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-yellow-500"
        >
          <option value="">Kaikki vuodet</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {filterYear && (
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-yellow-500"
          >
            <option value="">Kaikki kuukaudet</option>
            {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}

        {bikes.length > 0 && (
          <select
            value={filterBike}
            onChange={e => setFilterBike(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-yellow-500"
          >
            <option value="">Kaikki pyörät</option>
            {bikes.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}

        {(filterYear || filterMonth || filterBike) && (
          <button
            onClick={() => { setFilterYear(''); setFilterMonth(''); setFilterBike(''); }}
            className="text-xs text-gray-400 hover:text-gray-600 px-2"
          >
            Tyhjennä suodattimet
          </button>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mb-3">
          {total} ajoa yhteensä
          {rides.length > 0 && ` · näytetään ${offset + 1}–${Math.min(offset + rides.length, total)}`}
        </p>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Ladataan...</p>
      ) : rides.length === 0 ? (
        <p className="text-gray-400 text-center py-12">Ei ajoja</p>
      ) : (
        <div className="space-y-2">
          {rides.map(ride => (
            <div key={ride.id} className="bg-white rounded-xl p-4 border border-gray-200 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xl font-bold text-green-700">
                    {ride.km % 1 === 0 ? ride.km : ride.km.toFixed(1)} km
                  </span>
                  <span className="text-xs text-gray-500">{ride.bike}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(ride.date)}</p>
                {ride.route && <p className="text-xs text-gray-600 mt-0.5 truncate">{ride.route}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditingRide(ride)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(ride.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
                    <path d="M10,11v6M14,11v6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > LIMIT && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => fetchRides(Math.max(0, offset - LIMIT))}
            disabled={offset === 0}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            ← Edellinen
          </button>
          <span className="text-sm text-gray-400">
            {Math.floor(offset / LIMIT) + 1} / {Math.ceil(total / LIMIT)}
          </span>
          <button
            onClick={() => fetchRides(offset + LIMIT)}
            disabled={offset + LIMIT >= total}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            Seuraava →
          </button>
        </div>
      )}

      {editingRide && (
        <RideForm
          ride={editingRide}
          onSave={handleSave}
          onCancel={() => setEditingRide(null)}
        />
      )}

      {showImport && (
        <CsvImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { fetchRides(0); fetchBikes(); }}
        />
      )}
    </div>
  );
}
