import { useState } from 'react';
import { api } from '../api/client';

export default function GoalBar({ year, goalKm, currentKm, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  const pct = goalKm ? Math.min((currentKm / goalKm) * 100, 100) : 0;
  const exceeded = goalKm && currentKm >= goalKm;

  async function saveGoal() {
    const val = parseFloat(input);
    if (!val || val <= 0) return;
    setSaving(true);
    try {
      await api.updateGoal(year, val);
      onUpdate();
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (!goalKm && !editing) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Ei vuositavoitetta asetettu</p>
          <button
            onClick={() => { setInput(''); setEditing(true); }}
            className="text-sm text-green-700 hover:text-green-600 font-medium"
          >
            Aseta tavoite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Vuositavoite {year}</p>
          {goalKm && (
            <p className="text-sm text-gray-700 mt-0.5">
              <span className="text-green-700 font-semibold">{currentKm.toLocaleString('fi-FI', { maximumFractionDigits: 0 })}</span>
              {' / '}
              <span>{goalKm.toLocaleString('fi-FI')} km</span>
              <span className="text-gray-400 ml-2">({pct.toFixed(1)} %)</span>
            </p>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => { setInput(String(goalKm || '')); setEditing(true); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Muokkaa
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tavoite km"
            className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-yellow-500"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setEditing(false); }}
          />
          <button
            onClick={saveGoal}
            disabled={saving}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg text-sm font-medium"
          >
            {saving ? '...' : 'OK'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-2 border border-gray-300 text-gray-500 rounded-lg text-sm hover:bg-gray-50"
          >
            ✕
          </button>
        </div>
      ) : goalKm ? (
        <div className="relative">
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${exceeded ? 'bg-yellow-400' : 'bg-green-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {exceeded && (
            <p className="text-xs text-yellow-600 mt-1 font-medium">
              🏆 Tavoite saavutettu! {((currentKm / goalKm - 1) * 100).toFixed(0)} % yli
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
