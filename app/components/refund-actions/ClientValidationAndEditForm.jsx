'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { clientValidateRequest } from '@/actions/clientActions';
import { Button } from '@/components/ui/button';
import ClientEditDetailsForm from '@/components/refund-actions/ClientEditDetailsForm';
import { InfoCard } from '@/components/ui/InfoCard'; // Assuming InfoCard is a reusable UI component
import { toast } from 'sonner';

// This component handles editing details and validating the request for AWAITING_CLIENT_VALIDATION status
export default function ClientValidationAndEditForm({ refundRequest, actorName }) {
  const [isChecked, setIsChecked] = useState(false);
  const initialState = { error: null, success: false, message: '', fieldErrors: null, noChanges: false };
  const [state, formAction] = useActionState(clientValidateRequest, initialState);
  const [isTransitionPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || 'Request validated and submitted successfully!');
    } else if (state.error) {
      toast.error(state.error || 'Failed to validate request.', {
        description: state.fieldErrors ? 
          Object.entries(state.fieldErrors).map(([field, msg]) => `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${msg}`).join('; ') :
          (state.noChanges && !state.success ? 'No changes were made to details.' : undefined) // Show only if noChanges but not success
      });
    } else if (state.noChanges && !state.success) { 
       toast.info(state.message || 'Details saved. Please confirm to submit.');
    }
  }, [state]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };
  
  const SubmitValidationButton = () => {
    const { pending } = useFormStatus();
    return (
        <Button 
            type="submit" 
            disabled={pending || state.success || !isChecked || isTransitionPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending || isTransitionPending ? 'Submitting...' : (state.success ? 'Submitted!' : 'Confirm & Submit Request')}
        </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <InfoCard title="Review and Edit Your Details">
        <ClientEditDetailsForm 
            requestData={refundRequest} 
            actorName={actorName} 
            asStandaloneForm={false} 
        />
      </InfoCard>
      
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Confirm Your Request Submission</h3>
        {/* refundRequestId and actorName are now part of ClientEditDetailsForm when asStandaloneForm is false */}
        {/* So they are already included in the form data submitted by that component's fields. */}

        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">
            Please review all your refund request details. By checking the box below and submitting, 
            you confirm that all information (including any changes made above) is accurate, and you agree to proceed with the refund process.
          </p>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id={`confirmValidation_${refundRequest.id}`}
                name="confirmValidation" 
                type="checkbox"
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                checked={isChecked}
                onChange={() => setIsChecked(!isChecked)}
                required 
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor={`confirmValidation_${refundRequest.id}`} className="font-medium text-gray-700">
                I confirm the details of this refund request are correct and complete.
              </label>
            </div>
          </div>
        </div>
        <SubmitValidationButton />
        {/* Display general error message if not field-specific */}
        {state.error && !state.fieldErrors && <p className="mt-2 text-sm text-red-600">Error: {state.error}</p>}
      </div>
    </form>
  );
} 