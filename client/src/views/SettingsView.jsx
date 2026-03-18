import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import GoalBar from '../components/GoalBar';

export default function SettingsView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  function setField(field, value) {
    setPwForm(f => ({ ...f, [field]: value }));
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwError('Uudet salasanat eivät täsmää'); return; }
    if (pwForm.next.length < 6) { setPwError('Salasanan tulee olla vähintään 6 merkkiä'); return; }
    setPwLoading(true);
    setPwError('');
    try {
      await api.changePassword(pwForm.current, pwForm.next);
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Asetukset</h1>

      <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">
          🚴
        </div>
        <div>
          <p className="font-medium text-gray-900">{user?.username || '—'}</p>
          <p className="text-xs text-gray-400">Kirjautunut sisään</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Vuositavoite {currentYear}
        </h2>
        <GoalBarLoader year={currentYear} />
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Vaihda salasana
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { field: 'current', label: 'Nykyinen salasana' },
            { field: 'next', label: 'Uusi salasana' },
            { field: 'confirm', label: 'Vahvista uusi salasana' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input
                type="password"
                value={pwForm[field]}
                onChange={e => setField(field, e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-yellow-500 text-sm"
                required
              />
            </div>
          ))}
          {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm">Salasana vaihdettu!</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium text-sm disabled:opacity-50"
          >
            {pwLoading ? 'Vaihdetaan...' : 'Vaihda salasana'}
          </button>
        </form>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium hover:bg-red-50 transition-colors"
      >
        Kirjaudu ulos
      </button>

      <div className="text-center text-xs text-gray-300 pt-2">
        <p>Harmsun Pyöräily · v1.0</p>
      </div>
    </div>
  );
}

function GoalBarLoader({ year }) {
  const [goal, setGoal] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getGoal(year).then(g => { setGoal(g); setLoaded(true); }).catch(() => setLoaded(true));
  }, [year]);

  if (!loaded) return <p className="text-xs text-gray-400">Ladataan...</p>;

  return (
    <GoalBar
      year={year}
      goalKm={goal?.goalKm}
      currentKm={goal?.currentKm || 0}
      onUpdate={() => api.getGoal(year).then(setGoal).catch(() => {})}
    />
  );
}
