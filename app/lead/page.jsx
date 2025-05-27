'use client'
import Link from 'next/link';
// import { prisma } from '@/lib/prisma.js'; // Not used in client component directly
import { RefundStatus } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, use } from 'react'; // Added use
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;

export default function LeadDashboard({ searchParams: searchParamsProp }) { // Renamed for clarity
  const router = useRouter();
  const searchParams = use(searchParamsProp); // Unwrap searchParams
  
  const [refundRequests, setRefundRequests] = React.useState([]);
  const [totalRequests, setTotalRequests] = React.useState(0);
  const [error, setError] = React.useState(null);
  const currentPage = Number(searchParams?.page) || 1;

  React.useEffect(() => {
    async function fetchData() {
      setError(null); // Reset error before new fetch
      try {
        // const whereClause = {
        //   status: 'PENDING_LEAD_APPROVAL',
        // }; // This logic is now in the API route
        const response = await fetch(`/api/refunds?role=lead&page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
        if (!response.ok) {
          // Try to parse error details from response body
          const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorData.detail || response.statusText}`);
        }
        const data = await response.json();
        setRefundRequests(data.requests || []);
        setTotalRequests(data.totalCount || 0);
      } catch (err) {
        console.error('Data fetching error (LeadDashboard):', err);
        setError(err.message || 'Failed to load refund requests. Please try again later.');
      }
    }
    fetchData();
  }, [currentPage]);

  const handleRowClick = (requestId) => {
    router.push(`/refunds/${requestId}?simulatedRole=team_lead`);
  };

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">Team Lead Dashboard</h1>
      <h2 className="text-xl font-semibold text-slate-700 mb-4">
        Requests Awaiting Your Approval
      </h2>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      {refundRequests.length === 0 && !error && (
        <p className="text-slate-600">No refund requests currently awaiting your approval.</p>
      )}
      {refundRequests.length > 0 && !error && (
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Request ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Updated At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {refundRequests.map((request) => (
                <tr 
                  key={request.id} 
                  className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => handleRowClick(request.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 hover:underline">
                    {request.ticketId || request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{request.clientFirstName} {request.clientLastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {request.currency === 'USD' ? '$' : request.currency === 'EUR' ? '€' : request.currency === 'GBP' ? '£' : ''}{typeof request.amount === 'number' ? request.amount.toFixed(2) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(request.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {refundRequests.length > 0 && !error && (
        <PaginationControls totalItems={totalRequests} itemsPerPage={ITEMS_PER_PAGE} />
      )}
    </div>
  );
} 