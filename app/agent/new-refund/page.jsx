'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createRefundRequestByAgent } from '@/actions/agentActions'; // Assuming this action will be created
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-slate-700 hover:bg-slate-800 text-white">
      {pending ? 'Creating Request...' : 'Create Refund Request'}
    </Button>
  );
}

function formatFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== 'object' || Object.keys(fieldErrors).length === 0) {
    return undefined;
  }
  return Object.entries(fieldErrors).map(([field, message]) => `${field}: ${message}`).join('; ');
}

export default function NewRefundPage() {
  const router = useRouter();
  const initialState = { message: null, error: null, success: false, refundId: null, errors: {} };
  // The 'actorName' will be ideally fetched from session or passed appropriately in a real app
  // For now, we'll hardcode or assume it's passed if this component is enhanced.
  const [state, dispatch] = useActionState(
    (prevState, formData) => createRefundRequestByAgent(prevState, formData, 'Agent User'), // Pass actorName here
    initialState
  );

  useEffect(() => {
    if (state.success && state.refundId) {
      toast.success(state.message || 'Refund request created successfully!', {
        description: `Refund ID: ${state.refundId}`,
        action: {
          label: 'View Request',
          onClick: () => router.push(`/refunds/${state.refundId}?simulatedRole=agent`)
        }
      });
    } else if (state.success) {
      toast.success(state.message || 'Refund request created successfully!');
    } else if (state.error) {
      toast.error(state.error || 'Failed to create refund request.', {
        description: state.fieldErrors ? formatFieldErrors(state.fieldErrors) : undefined,
      });
    }
  }, [state, router]);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">New Refund Request</h1>
        <Link href="/agent">
          <Button variant="outline">&larr; Back to Dashboard</Button>
        </Link>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
        <form action={dispatch} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="clientFirstName" className="text-sm font-medium text-slate-700">Client First Name <span className="text-red-500">*</span></Label>
              <Input id="clientFirstName" name="clientFirstName" required className="mt-1" />
              {state.errors?.clientFirstName && <p className="text-xs text-red-500 mt-1">{state.errors.clientFirstName}</p>}
            </div>
            <div>
              <Label htmlFor="clientLastName" className="text-sm font-medium text-slate-700">Client Last Name <span className="text-red-500">*</span></Label>
              <Input id="clientLastName" name="clientLastName" required className="mt-1" />
              {state.errors?.clientLastName && <p className="text-xs text-red-500 mt-1">{state.errors.clientLastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="clientEmail" className="text-sm font-medium text-slate-700">Client Email <span className="text-red-500">*</span></Label>
            <Input id="clientEmail" name="clientEmail" type="email" required className="mt-1" />
            {state.errors?.clientEmail && <p className="text-xs text-red-500 mt-1">{state.errors.clientEmail}</p>}
          </div>

          <div>
            <Label htmlFor="zendeskTicketId" className="text-sm font-medium text-slate-700">Zendesk Ticket ID (Optional)</Label>
            <Input id="zendeskTicketId" name="zendeskTicketId" className="mt-1" placeholder="e.g., 12345"/>
            {state.errors?.zendeskTicketId && <p className="text-xs text-red-500 mt-1">{state.errors.zendeskTicketId}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Label htmlFor="amount" className="text-sm font-medium text-slate-700">Refund Amount <span className="text-red-500">*</span></Label>
                <Input id="amount" name="amount" type="number" step="0.01" required className="mt-1" />
                {state.errors?.amount && <p className="text-xs text-red-500 mt-1">{state.errors.amount}</p>}
            </div>
            <div>
                <Label htmlFor="currency" className="text-sm font-medium text-slate-700">Currency <span className="text-red-500">*</span></Label>
                <select 
                    id="currency" 
                    name="currency" 
                    required 
                    className="mt-1 block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    {/* Add other currencies as needed */}
                </select>
                {state.errors?.currency && <p className="text-xs text-red-500 mt-1">{state.errors.currency}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="reason" className="text-sm font-medium text-slate-700">Reason for Refund <span className="text-red-500">*</span></Label>
            <Textarea id="reason" name="reason" required rows={3} className="mt-1" />
            {state.errors?.reason && <p className="text-xs text-red-500 mt-1">{state.errors.reason}</p>}
          </div>

          {/* Payment Details - Keep it simple for now, can be expanded */}
          <h4 className="text-md font-semibold text-slate-800 pt-4 border-t border-slate-200 mt-6 mb-2">Payment Details (Optional - Client may provide/edit)</h4>
           <div>
            <Label htmlFor="iban" className="text-sm font-medium text-slate-700">IBAN</Label>
            <Input id="iban" name="iban" placeholder="DE00..." className="mt-1" />
             {state.errors?.iban && <p className="text-xs text-red-500 mt-1">{state.errors.iban}</p>}
          </div>
           <div>
            <Label htmlFor="bic" className="text-sm font-medium text-slate-700">BIC/SWIFT</Label>
            <Input id="bic" name="bic" placeholder="BANKDEFF..." className="mt-1" />
            {state.errors?.bic && <p className="text-xs text-red-500 mt-1">{state.errors.bic}</p>}
          </div>
          
          {state.error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>}
          
          <SubmitButton />
        </form>
      </div>
    </div>
  );
} 