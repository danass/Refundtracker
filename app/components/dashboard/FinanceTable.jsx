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

function BulkSubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Processing...' : 'Process Selected Payments'}</Button>;
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
        toast.success("Bulk Action Successful", { description: state.message });
      } else if (state.successCount > 0 && state.failureCount > 0) {
        toast.warning("Bulk Action Partially Successful", { description: state.message });
      } else if (state.failureCount > 0 && state.successCount === 0){
        toast.error("Bulk Action Failed", { description: state.message });
      } else if (state.error) {
        toast.error("Bulk Action Error", { description: state.error });
      } else {
         toast.info("Bulk Action Update", { description: state.message });
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
        <div className="my-4 p-4 bg-slate-100 rounded-md flex items-center gap-4">
          <p className="text-sm font-medium">{selectedRequests.length} request(s) selected for payment processing.</p>
          <Textarea name="financeNotes" placeholder="Optional: Add a common note for selected items." rows={2} className="max-w-md bg-white"/>
          <BulkSubmitButton />
        </div>
      )}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                <Checkbox 
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all eligible requests for payment processing"
                  disabled={refundRequests.filter(r => r.status === 'APPROVED_FOR_PAYMENT').length === 0}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Request ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {refundRequests.map((request) => {
              const isEligibleForBulkProcess = request.status === 'APPROVED_FOR_PAYMENT';
              return (
                <tr 
                  key={request.id} 
                  onClick={() => handleRowClick(request.id)} 
                  className={`hover:bg-slate-100 cursor-pointer ${selectedRequests.includes(request.id) ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      id={`select-${request.id}`}
                      checked={selectedRequests.includes(request.id)}
                      onCheckedChange={(checked) => handleSelectRequest(request.id, checked)}
                      disabled={!isEligibleForBulkProcess}
                      aria-label={`Select request ${request.id} for payment processing`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{request.ticketId || request.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{request.clientFirstName} {request.clientLastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {request.currency === 'USD' ? '$' : request.currency === 'EUR' ? '€' : request.currency === 'GBP' ? '£' : ''}{typeof request.amount === 'number' ? request.amount.toFixed(2) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={(() => {
                      const s = request.status;
                      if (s === RefundStatus.APPROVED_FOR_PAYMENT) return 'approved';
                      if (s === RefundStatus.PAYMENT_PROCESSING) return 'processing';
                      if (s === RefundStatus.PAID) return 'success';
                      if (s.includes('ERROR')) return 'destructive';
                      return 'default';
                    })()} className="text-xs">
                      {request.status ? request.status.replace(/_/g, ' ') : 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(request.updatedAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </form>
  );
} 