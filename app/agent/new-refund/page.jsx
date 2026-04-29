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
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Création en cours...' : 'Créer la demande de remboursement'}
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
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/agent" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
          ← Retour
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle demande de remboursement</h1>
        <p className="text-sm text-gray-500 mt-0.5">Remplir les informations du client et de la demande</p>
      </div>
      <div className="bg-white border rounded-lg p-6" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        <form action={dispatch} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="clientFirstName" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prénom <span className="text-red-500">*</span></Label>
              <Input id="clientFirstName" name="clientFirstName" required className="mt-1.5" />
              {state.errors?.clientFirstName && <p className="text-xs text-red-500 mt-1">{state.errors.clientFirstName}</p>}
            </div>
            <div>
              <Label htmlFor="clientLastName" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom <span className="text-red-500">*</span></Label>
              <Input id="clientLastName" name="clientLastName" required className="mt-1.5" />
              {state.errors?.clientLastName && <p className="text-xs text-red-500 mt-1">{state.errors.clientLastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="clientEmail" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email client <span className="text-red-500">*</span></Label>
            <Input id="clientEmail" name="clientEmail" type="email" required className="mt-1.5" />
            {state.errors?.clientEmail && <p className="text-xs text-red-500 mt-1">{state.errors.clientEmail}</p>}
          </div>

          <div>
            <Label htmlFor="zendeskTicketId" className="text-xs font-medium text-gray-500 uppercase tracking-wide">ID ticket Zendesk</Label>
            <Input id="zendeskTicketId" name="zendeskTicketId" className="mt-1.5" placeholder="ex. 12345" />
            {state.errors?.zendeskTicketId && <p className="text-xs text-red-500 mt-1">{state.errors.zendeskTicketId}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="amount" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Montant <span className="text-red-500">*</span></Label>
              <Input id="amount" name="amount" type="number" step="0.01" required className="mt-1.5" />
              {state.errors?.amount && <p className="text-xs text-red-500 mt-1">{state.errors.amount}</p>}
            </div>
            <div>
              <Label htmlFor="currency" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Devise <span className="text-red-500">*</span></Label>
              <select
                id="currency"
                name="currency"
                required
                className="mt-1.5 block w-full py-2 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                style={{ borderColor: 'hsl(220,13%,89%)' }}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
              {state.errors?.currency && <p className="text-xs text-red-500 mt-1">{state.errors.currency}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="reason" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Motif <span className="text-red-500">*</span></Label>
            <Textarea id="reason" name="reason" required rows={3} className="mt-1.5" />
            {state.errors?.reason && <p className="text-xs text-red-500 mt-1">{state.errors.reason}</p>}
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Coordonnées bancaires (optionnel)</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="iban" className="text-xs font-medium text-gray-500 uppercase tracking-wide">IBAN</Label>
                <Input id="iban" name="iban" placeholder="FR76..." className="mt-1.5" />
                {state.errors?.iban && <p className="text-xs text-red-500 mt-1">{state.errors.iban}</p>}
              </div>
              <div>
                <Label htmlFor="bic" className="text-xs font-medium text-gray-500 uppercase tracking-wide">BIC/SWIFT</Label>
                <Input id="bic" name="bic" placeholder="BANKDEFF..." className="mt-1.5" />
                {state.errors?.bic && <p className="text-xs text-red-500 mt-1">{state.errors.bic}</p>}
              </div>
            </div>
          </div>

          {state.error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
} 