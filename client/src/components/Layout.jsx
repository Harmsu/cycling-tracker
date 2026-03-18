import { Outlet, NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/',
    end: true,
    label: 'Kalenteri',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: '/tilastot',
    label: 'Tilastot',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    to: '/historia',
    label: 'Historia',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" strokeLinecap="round" strokeWidth={3} />
        <line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round" strokeWidth={3} />
        <line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round" strokeWidth={3} />
      </svg>
    ),
  },
  {
    to: '/asetukset',
    label: 'Asetukset',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors
        ${isActive
          ? 'text-green-700 bg-green-50'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Layout() {
  return (
    <div className="flex h-screen bg-yellow-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 py-6 px-3 gap-1 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 mb-6">
          <span className="text-2xl">🚴</span>
          <div>
            <p className="font-bold text-green-700 leading-tight">Pyöräily</p>
            <p className="text-xs text-gray-400">Harmsun seuranta</p>
          </div>
        </div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'text-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around px-2 pt-2 pb-safe safe-bottom z-40">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>
    </div>
  );
}
