import { prisma } from '@/lib/prisma.js';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefundStatus } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';

const SIMULATED_CLIENT_EMAIL = 'alice.wonder@example.com';
const ITEMS_PER_PAGE = 10;

export default async function ClientDashboardPage({ searchParams: searchParamsInput }) {
  const searchParams = await searchParamsInput;
  let requests = [];
  let totalRequests = 0;
  let error = null;
  const currentPage = Number(searchParams?.page) || 1;

  try {
    const whereClause = {
      clientEmail: SIMULATED_CLIENT_EMAIL 
      // OR: [
      //   { clientEmail: SIMULATED_CLIENT_EMAIL },
      //   { id: 'REPLACE_WITH_A_CLIENT_REQUEST_ID_FROM_SEED' }
      // ],
    };

    totalRequests = await prisma.refundRequest.count({ where: whereClause });

    requests = await prisma.refundRequest.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'desc',
      },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      include: {},
    });
  } catch (e) {
    console.error("Failed to fetch client refund requests:", e);
    error = "Could not load your refund requests at this time. Please try again later.";
  }

  const getStatusVariant = (status) => {
    if (status.includes('REJECT') || status.includes('CANCEL')) return 'destructive';
    if (status.includes('PAID') || status.includes('APPROVED')) return 'success';
    if (status.includes('AWAITING') || status.includes('RETURNED_TO_CLIENT')) return 'warning';
    return 'default';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Refund Requests</h1>
        {/* Future: Button to initiate a new request for client? */}
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
          <p className="font-semibold">Error Loading Requests</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {requests.length === 0 && !error && (
        <div className="text-center py-16 bg-white rounded-lg shadow-md border border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="mt-5 text-xl font-semibold text-slate-700">No Refund Requests Found</h2>
          <p className="mt-2 text-sm text-slate-500">You haven't submitted any refund requests yet.</p>
        </div>
      )}
      {requests.length > 0 && !error && (
        <div className="bg-white shadow-md rounded-lg border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-200">
            {requests.map((request) => (
              <li key={request.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                <Link
                  href={`/refunds/${request.id}?simulatedRole=client`}
                  className="block p-5 sm:p-6 focus:outline-none focus:bg-slate-100/70 group"
                  >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors duration-150">
                      Request ID: <span className="text-slate-800 group-hover:text-slate-900">{request.ticketId || request.id}</span>
                    </p>
                    <Badge variant={(() => {
                      const s = request.status;
                      if (s === RefundStatus.PENDING_AGENT_REVIEW) return 'agent-pending'; // Or a generic 'pending'
                      if (s === RefundStatus.RETURNED_TO_AGENT_FOR_EDITS) return 'warning';
                      if (s === RefundStatus.PENDING_LEAD_APPROVAL) return 'lead-pending'; // Or a generic 'pending'
                      if (s === RefundStatus.PENDING_FINAL_APPROVAL) return 'supervisor-pending'; // Or a generic 'pending'
                      if (s === RefundStatus.APPROVED_FOR_PAYMENT) return 'approved';
                      if (s === RefundStatus.PAYMENT_PROCESSING) return 'processing';
                      if (s === RefundStatus.PAID) return 'success';
                      if (s === RefundStatus.AWAITING_CLIENT_VALIDATION || s === RefundStatus.RETURNED_TO_CLIENT_FOR_INFO) return 'client-action';
                      if (s.includes('REJECT') || s.includes('CANCEL')) return 'destructive';
                      return 'default';
                    })()} className="text-xs">
                      {request.status ? request.status.replace(/_/g, ' ') : 'N/A'}
                    </Badge>
                  </div>
                  <div className="mt-1.5 text-sm text-slate-600 group-hover:text-slate-700 transition-colors duration-150">
                     Reason: {request.reason && request.reason.length > 70 ? request.reason.substring(0, 70) + '...' : request.reason || 'Not specified'}
                  </div>
                  <div className="mt-4 sm:flex sm:justify-between text-xs text-slate-500 group-hover:text-slate-600 transition-colors duration-150">
                    <p className="flex items-center">
                      Amount: <span className="font-medium text-slate-700 group-hover:text-slate-800 ml-1">{request.currency === 'USD' ? '$' : request.currency === 'EUR' ? '€' : request.currency === 'GBP' ? '£' : ''}{request.amount.toFixed(2)} {request.currency}</span>
                    </p>
                    <p className="mt-1.5 sm:mt-0 flex items-center">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400 group-hover:text-slate-500 transition-colors duration-150" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Last updated: <time dateTime={request.updatedAt} className="ml-1">{new Date(request.updatedAt).toLocaleString()}</time>
                    </p>
                  </div>
                   {(request.status === RefundStatus.AWAITING_CLIENT_VALIDATION || request.status === RefundStatus.RETURNED_TO_CLIENT_FOR_INFO) && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
                            <p className="text-xs font-semibold text-yellow-800">Action Required: <span className="font-normal text-yellow-700">Please review and {request.status === RefundStatus.AWAITING_CLIENT_VALIDATION ? 'confirm your details.' : 'provide the requested information.'}</span></p>
                        </div>
                    )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {requests.length > 0 && !error && (
        <PaginationControls totalItems={totalRequests} itemsPerPage={ITEMS_PER_PAGE} />
      )}
    </div>
  );
} 