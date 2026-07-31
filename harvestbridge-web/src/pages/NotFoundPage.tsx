import { Link } from 'react-router-dom';

import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-harvest-700">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Page not found</h1>
        <Link to="/dashboard" className="mt-6 inline-flex">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
