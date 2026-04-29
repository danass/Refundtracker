'use client';
import { useActionState, useEffect } from 'react';
import { updateRefundInternalNotes } from '@/actions/commonActions';
import { toast } from 'sonner';

export default function UpdateInternalNotesForm({ requestId, currentNotes }) {
  const initialState = { error: null, success: false, message: '' };

  const [state, formAction, isPending] = useActionState(updateRefundInternalNotes, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || 'Notes internes mises à jour.');
    } else if (state.error) {
      toast.error(state.error || 'Échec de la mise à jour des notes internes.');
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <textarea
        id={`internalNotes-${requestId}`}
        name="internalNotes"
        defaultValue={currentNotes || ''}
        rows={3}
        className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-300 transition-all"
        style={{ borderColor: 'hsl(220,13%,89%)' }}
        placeholder="Ajouter ou modifier les notes internes…"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
} 