'use client';

import { useActionState, useEffect, useState } from 'react';
import { clientProvideIban } from '@/actions/clientActions';
import { toast } from 'sonner';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ClientProvideIbanForm({ requestId, inline = false }) {
  const [open, setOpen] = useState(true);
  const [state, formAction, isPending] = useActionState(clientProvideIban, { error: null, success: false, message: '' });

  useEffect(() => {
    if (state.success) {
      toast.success('Coordonnées bancaires enregistrées.');
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  if (inline) {
    // Flat form, no toggle, for use inside ClientRefundView
    return (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="requestId" value={requestId} />
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            IBAN <span className="text-amber-500">*</span>
          </label>
          <input type="text" name="iban" required placeholder="FR76 3000 6000 0112 3456 7890 189"
            className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono bg-white text-gray-900 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-300 transition-all"
            style={{ borderColor: state.fieldErrors?.iban ? '#fca5a5' : 'hsl(220,13%,89%)' }} />
          {state.fieldErrors?.iban && <p className="mt-1 text-xs text-red-500">{state.fieldErrors.iban}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">BIC / SWIFT</label>
            <input type="text" name="bic" placeholder="BNPAFRPP"
              className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono bg-white text-gray-900 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-300 transition-all"
              style={{ borderColor: state.fieldErrors?.bic ? '#fca5a5' : 'hsl(220,13%,89%)' }} />
            {state.fieldErrors?.bic && <p className="mt-1 text-xs text-red-500">{state.fieldErrors.bic}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Banque</label>
            <input type="text" name="bankName" placeholder="BNP Paribas"
              className="w-full px-3 py-2.5 border rounded-xl text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-300 transition-all"
              style={{ borderColor: 'hsl(220,13%,89%)' }} />
          </div>
        </div>
        <button type="submit" disabled={isPending || state.success}
          className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {isPending ? 'Enregistrement…' : state.success ? 'Enregistré ✓' : 'Enregistrer mes coordonnées bancaires'}
        </button>
      </form>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Renseigner vos coordonnées bancaires</p>
          <p className="text-xs text-gray-400 mt-0.5">Nécessaires pour recevoir votre remboursement</p>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <form action={formAction} className="border-t px-5 pb-5 pt-4 space-y-4" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <input type="hidden" name="requestId" value={requestId} />

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              IBAN <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="iban"
              required
              placeholder="FR76 3000 6000 0112 3456 7890 189"
              className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-300 transition-all"
              style={{ borderColor: state.fieldErrors?.iban ? '#fca5a5' : 'hsl(220,13%,89%)' }}
            />
            {state.fieldErrors?.iban && (
              <p className="mt-1 text-xs text-red-500">{state.fieldErrors.iban}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              BIC / SWIFT <span className="text-gray-300">(optionnel)</span>
            </label>
            <input
              type="text"
              name="bic"
              placeholder="BNPAFRPP"
              className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-300 transition-all"
              style={{ borderColor: state.fieldErrors?.bic ? '#fca5a5' : 'hsl(220,13%,89%)' }}
            />
            {state.fieldErrors?.bic && (
              <p className="mt-1 text-xs text-red-500">{state.fieldErrors.bic}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Nom de la banque <span className="text-gray-300">(optionnel)</span>
            </label>
            <input
              type="text"
              name="bankName"
              placeholder="BNP Paribas"
              className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-300 transition-all"
              style={{ borderColor: 'hsl(220,13%,89%)' }}
            />
          </div>

          <button
            type="submit"
            disabled={isPending || state.success}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Enregistrement…' : state.success ? 'Enregistré ✓' : 'Enregistrer mes coordonnées'}
          </button>
        </form>
      )}
    </div>
  );
}
