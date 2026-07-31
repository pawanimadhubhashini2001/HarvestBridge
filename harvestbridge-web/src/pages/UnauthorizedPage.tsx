import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '../components/ui/Button';

export function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f4] p-6">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 text-center shadow-soft">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-red-50 text-red-700">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">Unauthorized</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">This dashboard is only available to administrator accounts.</p>
        <Link to="/login" className="mt-6 inline-flex">
          <Button>Back to Login</Button>
        </Link>
      </section>
    </main>
  );
}
