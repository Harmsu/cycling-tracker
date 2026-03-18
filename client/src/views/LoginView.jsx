import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.login(username, password);
      login(token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🚴</div>
          <h1 className="text-2xl font-bold text-gray-900">Harmsun Pyöräily</h1>
          <p className="text-gray-500 mt-1">Henkilökohtainen kilometriseuranta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Käyttäjätunnus</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-yellow-500 transition-colors"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Salasana</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-yellow-500 transition-colors"
                required
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
          </button>
        </form>
      </div>
    </div>
  );
}
