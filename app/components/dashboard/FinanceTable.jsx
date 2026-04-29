'use client';

import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox'; 
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';
import { financeBulkProcessPayment } from '@/actions/financeActions';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { RefundStatus } from '@prisma/client';
import { getStatusLabel } from '@/lib/utils';

function BulkSubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Traitement...' : 'Traiter les paiements sélectionnés'}</Button>;
}

export default function FinanceTable({ refundRequests, actorName }) {
  const router = useRouter();
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const initialState = { message: null, error: null, successCount: 0, failureCount: 0 };
  const [state, dispatch] = useActionState(financeBulkProcessPayment, initialState);

  useEffect(() => {
    if (state?.message) {
      if (state.successCount > 0 && state.failureCount === 0) {
        toast.success("Action groupée réussie", { description: state.message });
      } else if (state.successCount > 0 && state.failureCount > 0) {
        toast.warning("Action groupée partiellement réussie", { description: state.message });
      } else if (state.failureCount > 0 && state.successCount === 0){
        toast.error("Échec de l'action groupée", { description: state.message });
      } else if (state.error) {
        toast.error("Erreur action groupée", { description: state.error });
      } else {
         toast.info("Mise à jour", { description: state.message });
      }
      setSelectedRequests([]);
      setSelectAll(false);
    }
  }, [state]);

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedRequests(refundRequests.filter(r => r.status === 'APPROVED_FOR_PAYMENT').map(r => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (id, checked) => {
    if (checked) {
      setSelectedRequests(prev => [...prev, id]);
    } else {
      setSelectedRequests(prev => prev.filter(reqId => reqId !== id));
      setSelectAll(false);
    }
  };
  
  useEffect(() => {
    const eligibleRequests = refundRequests.filter(r => r.status === 'APPROVED_FOR_PAYMENT');
    if (eligibleRequests.length > 0 && selectedRequests.length === eligibleRequests.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedRequests, refundRequests]);

  const handleRowClick = (requestId) => {
    router.push(`/refunds/${requestId}?simulatedRole=finance`);
  };

  return (
    <form action={dispatch}>
      <input type="hidden" name="selectedIds" value={selectedRequests.join(',')} />
      <input type="hidden" name="actorName" value={actorName || 'Finance User'} />
      {selectedRequests.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-blue-800">{selectedRequests.length} demande(s) sélectionnée(s)</p>
          <div className="flex items-center gap-2">
            <Textarea name="financeNotes" placeholder="Note commune (optionnel)" rows={1} className="max-w-xs bg-white text-sm" />
            <BulkSubmitButton />
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg border overflow-x-auto" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        <table className="min-w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
              <th scope="col" className="px-4 py-3 w-10">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  disabled={refundRequests.filter(r => r.status === 'APPROVED_FOR_PAYMENT').length === 0}
                />
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mise à jour</th>
            </tr>
          </thead>
          <tbody>
            {refundRequests.map(request => {
              const isEligibleForBulkProcess = request.status === 'APPROVED_FOR_PAYMENT';
              const selected = selectedRequests.includes(request.id);
              return (
                <tr
                  key={request.id}
                  onClick={() => handleRowClick(request.id)}
                  className={`border-b cursor-pointer transition-colors hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''}`}
                  style={{ borderColor: 'hsl(220,13%,89%)' }}
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selected}
                      onCheckedChange={checked => handleSelectRequest(request.id, checked)}
                      disabled={!isEligibleForBulkProcess}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{request.ticketId || request.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{request.clientFirstName} {request.clientLastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {request.currency === 'USD' ? '$' : request.currency === 'EUR' ? '€' : request.currency === 'GBP' ? '£' : ''}
                    {typeof request.amount === 'number' ? request.amount.toFixed(2) : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={(() => {
                      const s = request.status;
                      if (s === RefundStatus.APPROVED_FOR_PAYMENT) return 'approved';
                      if (s === RefundStatus.PAYMENT_PROCESSING) return 'processing';
                      if (s === RefundStatus.PAID) return 'success';
                      if (s.includes('ERROR')) return 'destructive';
                      return 'default';
                    })()} className="text-xs">
                      {getStatusLabel(request.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{new Date(request.updatedAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </form>
  );
} 