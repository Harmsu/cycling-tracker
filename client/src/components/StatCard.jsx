export default function StatCard({ label, value, unit = 'km', accent = false, small = false }) {
  return (
    <div className={`bg-white rounded-xl p-4 border ${accent ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-bold ${small ? 'text-xl' : 'text-2xl'} ${accent ? 'text-green-700' : 'text-gray-900'}`}>
        {typeof value === 'number' ? value.toLocaleString('fi-FI', { maximumFractionDigits: 1 }) : value}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
