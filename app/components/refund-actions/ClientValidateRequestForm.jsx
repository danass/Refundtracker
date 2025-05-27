'use client';

import { useActionState, useEffect, useState } from 'react';
import { clientValidateRequest } from '@/actions/clientActions';
import GenericActionForm from './GenericActionForm';

export default function ClientValidateRequestForm({ refundRequest, actorName }) {
  const [isChecked, setIsChecked] = useState(false);
  const initialState = { error: null, success: false, message: '' };
  const [state, formAction, isPending] = useActionState(clientValidateRequest, initialState);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    if (state.success) {
      setToastMessage(state.message || 'Request validated and submitted successfully!');
      setToastType('success');
      setShowToast(true);
    } else if (state.error) {
      setToastMessage(state.error);
      setToastType('error');
      setShowToast(true);
    }
    if (state.success || state.error) {
        const timer = setTimeout(() => setShowToast(false), 5000);
        return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <form action={formAction} className="p-4 border border-gray-200 rounded-md bg-gray-50">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Client Request Validation</h3>
      <input type="hidden" name="refundRequestId" value={refundRequest.id} />
      <input type="hidden" name="actorName" value={actorName} />

      <div className="mb-4">
        <p className="text-sm text-gray-700 mb-2">
          Please review your refund request details. By checking the box below and submitting, 
          you confirm that all information is accurate and you agree to proceed with the refund process.
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
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor={`confirmValidation_${refundRequest.id}`} className="font-medium text-gray-700">
              I confirm the details of this refund request are correct.
            </label>
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending || state.success || !isChecked}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Submitting...' : (state.success ? 'Submitted!' : 'Confirm & Submit Request')}
      </button>
      {showToast && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-lg text-white z-50 ${toastType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toastMessage}
        </div>
      )}
      {state.error && <p className="mt-2 text-sm text-red-600">Error: {state.error}</p>}
    </form>
  );
} 