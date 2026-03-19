import { useState, useEffect } from 'react';

const BIKE_PRESETS = ['Punainen Paholainen', 'Helkama sähkäri', 'Vanha sähkäri'];

export default function RideForm({ date, ride, onSave, onCancel }) {
  const [form, setForm] = useState({
    date: date || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
    km: '',
    bike: 'Vanha sähkäri',
    route: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ride) {
      setForm({
        date: ride.date,
        km: String(ride.km),
        bike: ride.bike,
        route: ride.route || '',
      });
    } else if (date) {
      setForm(f => ({ ...f, date }));
    }
  }, [ride, date]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const km = parseFloat(form.km);
    if (!form.date) { setError('Päivämäärä vaaditaan'); return; }
    if (!km || km <= 0) { setError('Syötä kelvollinen matka'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        date: form.date,
        km,
        bike: form.bike || 'Pyörä',
        route: form.route || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {ride ? 'Muokkaa ajoa' : 'Lisää ajo'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Päivämäärä</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Matka (km) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="esim. 42.5"
              value={form.km}
              onChange={e => set('km', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500 text-lg font-semibold"
              required
              autoFocus={!ride}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Pyörä</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {BIKE_PRESETS.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => set('bike', b)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.bike === b
                      ? 'bg-yellow-400 border-yellow-400 text-gray-900 font-semibold'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Tai kirjoita oma..."
              value={form.bike}
              onChange={e => set('bike', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-yellow-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Reitti / kuvaus (valinnainen)</label>
            <input
              type="text"
              placeholder="esim. Nuuksio loop, Töölönlahti"
              value={form.route}
              onChange={e => set('route', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Peruuta
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Tallennetaan...' : ride ? 'Tallenna' : 'Lisää ajo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
