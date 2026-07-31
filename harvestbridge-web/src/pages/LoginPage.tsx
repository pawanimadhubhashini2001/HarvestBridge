import { Leaf, Lock, Mail } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { getApiError } from '../lib/api';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#f6f7f4] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-harvest-600">
            <Leaf size={24} />
          </span>
          <div>
            <p className="text-lg font-bold">HarvestBridge</p>
            <p className="text-sm text-slate-300">Admin Console</p>
          </div>
        </div>
        <div className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-wide text-harvest-100">Platform Operations</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">Manage trust, stores, products, and community activity.</h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Administrator access is restricted to approved HarvestBridge accounts.
          </p>
        </div>
        <p className="text-sm text-slate-400">Laravel API · PostgreSQL · React Admin</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-7">
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-md bg-harvest-50 text-harvest-700 lg:hidden">
              <Leaf size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-950">Admin Login</h1>
            <p className="mt-2 text-sm text-slate-600">Sign in with your administrator credentials.</p>
          </div>

          {error ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
            <span className="relative block">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-harvest-500 focus:ring-2 focus:ring-harvest-100"
              />
            </span>
          </label>

          <label className="mb-6 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <span className="relative block">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-harvest-500 focus:ring-2 focus:ring-harvest-100"
              />
            </span>
          </label>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </form>
      </section>
    </main>
  );
}
