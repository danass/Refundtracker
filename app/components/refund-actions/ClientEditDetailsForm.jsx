'use client';

import { useActionState, useEffect, useRef, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { clientUpdateDetailsAction } from '@/actions/clientActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function StandaloneSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
      {pending ? 'Submitting Changes...' : 'Submit Changes'}
    </Button>
  );
}

function formatFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== 'object' || Object.keys(fieldErrors).length === 0) {
    return undefined;
  }
  return Object.entries(fieldErrors).map(([field, message]) => `${field}: ${message}`).join('; ');
}

// New component for just the fields, without form handling
export function ClientEditDetailsFields({ requestData, actorName }) {
  return (
    <>
      <input type="hidden" name="refundRequestId" value={requestData.id} />
      {/* actorName is needed if the action being called by parent form needs it, 
          but clientValidateRequest might generate it. Let's keep it for now. */}
      <input type="hidden" name="actorName" value={actorName} />

      <div>
        <Label htmlFor="clientFirstName" className="text-sm font-medium text-slate-700">First Name</Label>
        <Input
          id="clientFirstName"
          name="clientFirstName"
          defaultValue={requestData.clientFirstName || ''}
          placeholder="Your First Name"
          className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
        />
      </div>

      <div>
        <Label htmlFor="clientLastName" className="text-sm font-medium text-slate-700">Last Name</Label>
        <Input
          id="clientLastName"
          name="clientLastName"
          defaultValue={requestData.clientLastName || ''}
          placeholder="Your Last Name"
          className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
        />
      </div>

      <div>
        <Label htmlFor="clientEmail" className="text-sm font-medium text-slate-700">Email Address (Read-only)</Label>
        <Input
          id="clientEmail"
          name="clientEmail"
          type="email"
          defaultValue={requestData.clientEmail || ''}
          readOnly
          className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm bg-slate-50 text-slate-700 cursor-not-allowed"
        />
      </div>
      
      <div>
        <Label htmlFor="clientAddress" className="text-sm font-medium text-slate-700">Your Full Address</Label>
        <Textarea
          id="clientAddress"
          name="clientAddress"
          defaultValue={requestData.clientAddress || ''}
          placeholder="Street, City, Postal Code, Country"
          className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
          rows={3}
        />
      </div>

      <h4 className="text-md font-semibold text-slate-800 pt-4 border-t border-slate-200 mt-6 mb-2">Payment Details (Bank Transfer)</h4>
      <p className="text-xs text-slate-500 -mt-1 mb-3">Please ensure your IBAN and BIC are correct to avoid payment delays.</p>
      <div>
        <Label htmlFor="iban" className="text-sm font-medium text-slate-700">IBAN</Label>
        <Input
          id="iban"
          name="iban"
          defaultValue={requestData.iban || ''}
          placeholder="DE00123456789012345678"
          className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
        />
      </div>

      <div>
        <Label htmlFor="bic" className="text-sm font-medium text-slate-700">BIC (Swift Code)</Label>
        <Input
          id="bic"
          name="bic"
          defaultValue={requestData.bic || ''}
          placeholder="BANKDEFFXXX"
          className="mt-1 w-full border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
        />
      </div>
    </>
  );
}


export default function ClientEditDetailsForm({ requestData, actorName, asStandaloneForm = true }) {
  const initialState = { message: null, error: null, success: false, noChanges: false };
  const [state, formAction] = useActionState(clientUpdateDetailsAction, initialState);
  const [isTransitionPending, startTransition] = useTransition();
  const formRef = useRef(null);

  useEffect(() => {
    if (asStandaloneForm && state) {
      if (state.success) {
        toast.success(state.message || 'Details updated successfully!');
      } else if (state.error) {
        toast.error(state.error || 'Failed to update details.', {
          description: state.fieldErrors ? formatFieldErrors(state.fieldErrors) : undefined,
        });
      } else if (state.noChanges) {
        toast.info(state.message || 'No changes were submitted.');
      }
    }
  }, [state, asStandaloneForm]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (formRef.current && asStandaloneForm && formAction) {
      const formData = new FormData(formRef.current);
      const confirmed = window.confirm('Are you sure you want to submit these changes? The request will be returned to an agent for review.');
      if (confirmed) {
        startTransition(() => {
          formAction(formData);
        });
      }
    }
  };

  const content = <ClientEditDetailsFields requestData={requestData} actorName={actorName} />;

  // New StandaloneSubmitButton that uses isTransitionPending from useTransition
  const CustomStandaloneSubmitButton = () => (
    <Button type="submit" disabled={isTransitionPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
      {isTransitionPending ? 'Submitting Changes...' : 'Submit Changes'}
    </Button>
  );

  if (asStandaloneForm) {
    return (
      <div className="bg-white shadow border border-slate-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Edit Your Request Details</h3>
        <p className="text-sm text-slate-600 mb-6">Please review and update your contact and payment information. Fields left blank will not be changed. Some fields may not be editable. If you submit changes, the request will be sent back for agent review.</p>
        {/* This form tag is only for standalone usage */}
        <form onSubmit={handleFormSubmit} ref={formRef} className="space-y-6">
          {content}
          <CustomStandaloneSubmitButton /> 
        </form>
      </div>
    );
  }

  // If not standalone, just return the fields with a simpler wrapper (no form, no title, no submit button)
  return (
    <div className="space-y-6">
      {content}
    </div>
  );
} 