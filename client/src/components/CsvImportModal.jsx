import { useState } from 'react';
import { api } from '../api/client';

export default function CsvImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.importCsv(file);
      setResult(res);
      if (res.imported > 0) onImported();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Tuo CSV-tiedosto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-500 border border-gray-200">
          <p className="font-medium text-gray-700 mb-1">CSV-muoto (ensimmäinen rivi otsikko):</p>
          <code className="block text-green-700">pvm,km,pyörä,reitti</code>
          <code className="block text-green-700">2026-01-05,42.5,Punainen Paholainen,Nuuksio</code>
          <p className="mt-1">Pakollinen: <strong>pvm</strong> (YYYY-MM-DD) ja <strong>km</strong>.</p>
        </div>

        {!result ? (
          <>
            <label className="block w-full cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`}>
                {file ? (
                  <div>
                    <p className="text-green-700 font-medium">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500">Klikkaa valitaksesi tiedosto</p>
                    <p className="text-xs text-gray-400 mt-1">.csv</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => setFile(e.target.files[0] || null)}
              />
            </label>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50"
              >
                Peruuta
              </button>
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="flex-1 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold disabled:opacity-50"
              >
                {loading ? 'Tuodaan...' : 'Tuo ajot'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-3">{result.imported > 0 ? '✅' : '⚠️'}</div>
            <p className="text-gray-900 font-semibold mb-1">
              Tuotu: <span className="text-green-700">{result.imported}</span> ajoa
            </p>
            {result.skipped > 0 && (
              <p className="text-gray-500 text-sm">Ohitettu (duplikaatit): {result.skipped}</p>
            )}
            {result.errors?.length > 0 && (
              <div className="mt-3 text-left">
                <p className="text-yellow-600 text-sm font-medium mb-1">Virheet:</p>
                <ul className="text-xs text-gray-500 space-y-0.5 max-h-24 overflow-y-auto">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-5 w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold"
            >
              Sulje
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
