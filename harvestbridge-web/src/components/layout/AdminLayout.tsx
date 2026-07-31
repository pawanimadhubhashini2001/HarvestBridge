import {
  BarChart3,
  ClipboardList,
  Home,
  Leaf,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Store,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { titleCase } from '../../lib/format';
import { Button } from '../ui/Button';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Stores', href: '/stores', icon: Store },
  { label: 'Harvest Products', href: '/products', icon: Package },
  { label: 'Stories', href: '/stories', icon: ClipboardList },
  { label: 'Donation Listings', href: '/donations', icon: Leaf },
  { label: 'Compost Listings', href: '/compost', icon: Leaf },
  { label: 'Reports', href: '/reports', icon: ShieldCheck },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500">
      <Link to="/dashboard" className="font-medium text-slate-700 hover:text-harvest-700">
        Admin
      </Link>
      {parts.map((part, index) => {
        const href = `/${parts.slice(0, index + 1).join('/')}`;
        const isLast = index === parts.length - 1;

        return (
          <span key={href} className="flex items-center gap-2">
            <span>/</span>
            {isLast ? (
              <span className="font-semibold text-slate-900">{titleCase(part)}</span>
            ) : (
              <Link to={href} className="hover:text-harvest-700">
                {titleCase(part)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = useMemo(
    () =>
      user?.name
        ?.split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() ?? 'AD',
    [user?.name],
  );

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <Link to="/dashboard" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-harvest-600 text-white">
            <Leaf size={21} />
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-950">HarvestBridge</span>
            <span className="block text-xs font-semibold text-slate-500">Admin Console</span>
          </span>
        </Link>
        <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-harvest-50 text-harvest-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`
            }>
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <button
          onClick={() => void handleLogout()}
          className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f6f7f4]">
      <div className="hidden fixed inset-y-0 left-0 z-40 lg:block">{sidebar}</div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-4">
            <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-3 rounded-md p-1.5 hover:bg-slate-100">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-slate-900 text-sm font-bold text-white">
                  {initials}
                </span>
                <span className="hidden text-left md:block">
                  <span className="block text-sm font-bold text-slate-950">{user?.name}</span>
                  <span className="block text-xs font-semibold text-slate-500">{user?.email}</span>
                </span>
              </button>
              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-60 rounded-lg border border-slate-200 bg-white p-2 shadow-soft">
                  <div className="px-3 py-2">
                    <p className="text-sm font-bold text-slate-950">{user?.name}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/settings')}>
                    <Settings size={16} />
                    Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-red-700" onClick={() => void handleLogout()}>
                    <LogOut size={16} />
                    Logout
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] px-4 py-6 md:px-6">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 px-4 py-4 text-sm text-slate-500 md:px-6">
          HarvestBridge Admin · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
