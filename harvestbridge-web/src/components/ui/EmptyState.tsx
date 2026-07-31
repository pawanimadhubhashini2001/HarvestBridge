import { Inbox } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div>
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200">
          <Inbox size={20} />
        </div>
        <h3 className="mt-4 text-sm font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
