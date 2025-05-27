'use client';

import Link from 'next/link';
import { RefundStatus } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, use } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { supervisorBulkApprove } from '@/actions/supervisorActions';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;

function BulkApproveButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="default" disabled={pending}>{pending ? 'Processing...' : 'Approve Selected'}</Button>;
}

export default function SupervisorDashboard({ searchParams: searchParamsProp }) {
  const router = useRouter();
  const searchParams = use(searchParamsProp);
  
  const [refundRequests, setRefundRequests] = useState([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [error, setError] = useState(null);
  const currentPage = Number(searchParams?.page) || 1;

  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const initialBulkActionState = { message: null, error: null, successCount: 0, failureCount: 0 };
  const [bulkActionState, bulkActionDispatch, isBulkActionPending] = useActionState(supervisorBulkApprove, initialBulkActionState);

  useEffect(() => {
    async function fetchData() {
      setError(null);
      try {
        const response = await fetch(`/api/refunds?role=supervisor&page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorData.detail || response.statusText}`);
        }
        const data = await response.json();
        setRefundRequests(data.requests || []);
        setTotalRequests(data.totalCount || 0);
      } catch (err) {
        console.error('Data fetching error (SupervisorDashboard):', err);
        setError(err.message || 'Failed to load refund requests. Please try again later.');
      }
    }
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    if (bulkActionState?.message) {
      if (bulkActionState.successCount > 0 && bulkActionState.failureCount === 0) {
        toast.success("Bulk Approve Successful", { description: bulkActionState.message });
      } else if (bulkActionState.successCount > 0 && bulkActionState.failureCount > 0) {
        toast.warning("Bulk Approve Partially Successful", { description: bulkActionState.message });
      } else if (bulkActionState.failureCount > 0 && bulkActionState.successCount === 0){
        toast.error("Bulk Approve Failed", { description: bulkActionState.message });
      } else if (bulkActionState.error) {
        toast.error("Bulk Approve Error", { description: bulkActionState.error });
      } else { 
         toast.info("Bulk Approve Update", { description: bulkActionState.message });
      }
      setSelectedRequests([]); 
      setSelectAll(false);
      async function refetchData() {
        try {
            const response = await fetch(`/api/refunds?role=supervisor&page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
            const data = await response.json();
            setRefundRequests(data.requests || []);
            setTotalRequests(data.totalCount || 0);
        } catch (e) { console.error("Refetch failed", e); setError("Failed to refresh data.")}
      }
      refetchData();
    }
  }, [bulkActionState, currentPage]);

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedRequests(refundRequests.filter(r => r.status === RefundStatus.PENDING_FINAL_APPROVAL).map(r => r.id));
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
    const eligibleRequests = refundRequests.filter(r => r.status === RefundStatus.PENDING_FINAL_APPROVAL);
    if (eligibleRequests.length > 0 && selectedRequests.length === eligibleRequests.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedRequests, refundRequests]);

  const handleRowClick = (requestId) => {
    router.push(`/refunds/${requestId}?simulatedRole=supervisor`);
  };

  if (error && !refundRequests.length) {
    return <p className="p-4 text-red-500">Error: {error}</p>;
  }

  const actorName = "Simulated Supervisor";

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">Supervisor Dashboard</h1>
      
      <h2 className="text-xl font-semibold text-slate-700 mb-4">
        Requests for Final Approval
      </h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">Error loading data: {error}</div>}

      <form action={bulkActionDispatch}>
        <input type="hidden" name="selectedIds" value={selectedRequests.join(',')} />
        <input type="hidden" name="actorName" value={actorName} />

        {selectedRequests.length > 0 && (
          <div className="my-4 p-4 bg-slate-100 rounded-md flex items-center justify-between gap-4 border border-slate-200 shadow">
            <p className="text-sm font-medium text-slate-700">{selectedRequests.length} request(s) selected for final approval.</p>
            <div className='flex items-center gap-2'>
                <Textarea name="supervisorNotes" placeholder="Optional: Add a common note for approved items." rows={2} className="max-w-md bg-white text-sm p-2"/>
                <BulkApproveButton />
            </div>
          </div>
        )}
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="p-3 text-left">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      id="select-all-supervisor"
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all eligible requests for final approval"
                      disabled={refundRequests.filter(r => r.status === RefundStatus.PENDING_FINAL_APPROVAL).length === 0}
                    />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Request ID</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {refundRequests.map((request) => {
                const isEligibleForBulkApprove = request.status === RefundStatus.PENDING_FINAL_APPROVAL;
                return (
                  <tr 
                    key={request.id} 
                    className={`hover:bg-slate-50 transition-colors duration-150 ${isEligibleForBulkApprove ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${selectedRequests.includes(request.id) ? 'bg-slate-100' : ''}`}
                    onClick={() => isEligibleForBulkApprove && handleRowClick(request.id)}
                  >
                    <td className="p-3 whitespace-nowrap">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          id={`select-supervisor-${request.id}`}
                          checked={selectedRequests.includes(request.id)}
                          onCheckedChange={(checked) => handleSelectRequest(request.id, checked)}
                          disabled={!isEligibleForBulkApprove}
                          aria-label={`Select request ${request.id} for final approval`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 hover:underline" onClick={(e) => {e.stopPropagation(); handleRowClick(request.id);}}>
                      {request.ticketId || request.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{request.clientFirstName} {request.clientLastName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {request.currency === 'USD' ? '$' : request.currency === 'EUR' ? '€' : request.currency === 'GBP' ? '£' : ''}{typeof request.amount === 'number' ? request.amount.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={(() => {
                        const s = request.status;
                        if (s === RefundStatus.PENDING_AGENT_REVIEW) return 'agent-pending';
                        if (s === RefundStatus.RETURNED_TO_AGENT_FOR_EDITS) return 'warning';
                        if (s === RefundStatus.PENDING_LEAD_APPROVAL) return 'lead-pending';
                        if (s === RefundStatus.PENDING_FINAL_APPROVAL) return 'supervisor-pending';
                        if (s === RefundStatus.APPROVED_FOR_PAYMENT) return 'approved';
                        if (s === RefundStatus.PAYMENT_PROCESSING) return 'processing';
                        if (s === RefundStatus.PAID) return 'success';
                        if (s === RefundStatus.AWAITING_CLIENT_VALIDATION || s === RefundStatus.RETURNED_TO_CLIENT_FOR_INFO) return 'client-action';
                        if (s.includes('REJECT') || s.includes('CANCEL')) return 'destructive';
                        return 'default';
                      })()} className="text-xs">
                        {request.status ? request.status.replace(/_/g, ' ') : 'N/A'}
                      </Badge>
                    </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{new Date(request.updatedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </form>
      {refundRequests.length === 0 && !error && (
         <p className="text-slate-600 mt-4">No refund requests currently require your final approval.</p>
      )}
      {totalRequests > 0 && !error && (
        <PaginationControls totalItems={totalRequests} itemsPerPage={ITEMS_PER_PAGE} />
      )}
    </div>
  );
} 