const toneClasses = {
  green: 'bg-harvest-50 text-harvest-700 ring-harvest-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  blue: 'bg-sky-50 text-sky-700 ring-sky-100',
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function Badge({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status?: string | null): keyof typeof toneClasses {
  if (!status) {
    return 'gray';
  }

  if (['active', 'available', 'approved', 'open', 'reviewed', 'resolved'].includes(status)) {
    return 'green';
  }

  if (['blocked', 'hidden', 'cancelled', 'deleted', 'rejected', 'closed'].includes(status)) {
    return 'red';
  }

  if (['pending', 'reserved', 'inactive', 'expired'].includes(status)) {
    return 'amber';
  }

  return 'blue';
}
