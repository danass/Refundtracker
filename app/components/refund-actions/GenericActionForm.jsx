'use client';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function GenericActionForm({
  refundRequest,
  actorName,
  serverAction,
  formTitle,
  textareaLabel,
  textareaName,
  textareaPlaceholder,
  textareaRequired = false,
  initialTextareaValue = '',
  submitButtonText,
  submitButtonProcessingText,
  submitButtonSuccessText,
  buttonClassName = 'bg-primary hover:bg-primary/90 text-primary-foreground',
  successMessage = 'Action successful!',
  children
}) {
  const initialState = { error: null, success: false, message: '' };
  const [state, formAction, isPending] = useActionState(serverAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || successMessage, { description: 'Action completed successfully.' });
    } else if (state.error) {
      toast.error(state.error || 'Action failed.', { description: 'Action failed.' });
    }
  }, [state, successMessage, 'Action failed.']);

  return (
    <form action={formAction} className="p-6 border border-slate-200 rounded-lg bg-white shadow-sm space-y-4">
      {formTitle && <h3 className="text-lg font-semibold text-slate-800 mb-2">{formTitle}</h3>}
      <input type="hidden" name="refundRequestId" value={refundRequest.id} />
      <input type="hidden" name="actorName" value={actorName} />
      
      {textareaLabel && (
        <div className="space-y-1">
          <label htmlFor={`${textareaName}_${refundRequest.id}`} className="block text-sm font-medium text-slate-700">
            {textareaLabel}
          </label>
          <textarea 
            id={`${textareaName}_${refundRequest.id}`} 
            name={textareaName} 
            rows="3" 
            className="w-full p-2 border rounded-md shadow-sm sm:text-sm border-slate-300 bg-white text-slate-900 focus:ring-slate-500 focus:border-slate-500 placeholder-slate-400"
            placeholder={textareaPlaceholder}
            required={textareaRequired}
            defaultValue={initialTextareaValue}
          />
        </div>
      )}

      {children}

      <button 
        type="submit" 
        disabled={isPending || state.success}
        className={`w-full font-semibold py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-150 ${buttonClassName}`}
      >
        {isPending ? (submitButtonProcessingText || 'Processing...') : (state.success ? (submitButtonSuccessText || 'Done') : submitButtonText)}
      </button>
      
      {state.error && !state.fieldErrors && !state.success && (
         <p className="mt-2 text-sm text-destructive text-center">Error: {state.error}</p>
      )}
    </form>
  );
} 