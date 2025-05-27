'use client';
import { useActionState, useEffect } from 'react';
import { updateRefundInternalNotes } from '@/actions/commonActions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function UpdateInternalNotesForm({ requestId, currentNotes }) {
  const initialState = { error: null, success: false, message: '' };

  const [state, formAction, isPending] = useActionState(updateRefundInternalNotes, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || 'Internal notes updated successfully.');
    } else if (state.error) {
      toast.error(state.error || 'Failed to update internal notes.');
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4 mb-6 p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
      <input type="hidden" name="requestId" value={requestId} />
      <div>
        <Label htmlFor={`internalNotes-${requestId}`} className="block text-sm font-semibold text-slate-700 mb-1.5">
            Edit Internal Notes:
        </Label>
        <Textarea
          id={`internalNotes-${requestId}`}
          name="internalNotes"
          defaultValue={currentNotes || ''}
          rows={3}
          className="w-full p-2 border rounded-md shadow-sm sm:text-sm border-slate-300 bg-white text-slate-900 focus:ring-slate-500 focus:border-slate-500 placeholder-slate-400"
          placeholder="Add or update internal notes..."
        />
      </div>
      <Button 
        type="submit" 
        disabled={isPending}
        variant="default"
        size="sm"
        className="bg-slate-700 hover:bg-slate-800 text-white"
      >
        {isPending ? 'Saving Notes...' : 'Save Internal Notes'}
      </Button>
    </form>
  );
} 