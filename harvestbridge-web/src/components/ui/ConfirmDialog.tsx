import { AlertTriangle } from 'lucide-react';

import { Button } from './Button';

export interface ConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => Promise<void> | void;
}

export function ConfirmDialog({
  state,
  busy,
  onClose,
}: {
  state: ConfirmState | null;
  busy?: boolean;
  onClose: () => void;
}) {
  if (!state) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-950">{state.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{state.description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={state.variant ?? 'primary'}
            onClick={() => void state.onConfirm()}
            disabled={busy}>
            {busy ? 'Working...' : state.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
