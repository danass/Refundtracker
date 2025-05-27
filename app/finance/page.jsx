import Link from 'next/link';
import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';
import FinanceTable from '@/components/dashboard/FinanceTable';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 10;

export default async function FinanceDashboard({ searchParams: searchParamsInput }) {
  const searchParams = await searchParamsInput;
  let refundRequests = [];
  let totalRequests = 0;
  let error = null;
  const currentPage = Number(searchParams?.page) || 1;
  const tab = searchParams?.tab || 'approved_for_payment';

  try {
    const whereClause = {};

    if (tab === 'approved_for_payment') {
      whereClause.status = RefundStatus.APPROVED_FOR_PAYMENT;
    } else if (tab === 'payment_processing') {
      whereClause.status = RefundStatus.PAYMENT_PROCESSING;
    } else if (tab === 'paid') {
      whereClause.status = RefundStatus.PAID;
    } else if (tab === 'all') {
      whereClause.OR = [
        { status: RefundStatus.APPROVED_FOR_PAYMENT },
        { status: RefundStatus.PAYMENT_PROCESSING },
        { status: RefundStatus.PAID },
        { status: RefundStatus.ERROR_PROCESSING_PAYMENT },
      ];
    } else {
      whereClause.status = RefundStatus.APPROVED_FOR_PAYMENT;
    }

    totalRequests = await prisma.refundRequest.count({ where: whereClause });

    refundRequests = await prisma.refundRequest.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'desc',
      },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    });
  } catch (err) {
    console.error('Database error fetching finance requests:', err);
    error = 'Failed to load refund requests. Please try again later.';
  }

  if (error) {
    return <p className="p-4 text-red-500">Error: {error}</p>;
  }

  const getTabName = (currentTab) => {
    switch(currentTab) {
        case 'approved_for_payment': return 'Approved for Payment';
        case 'payment_processing': return 'Payment Processing';
        case 'paid': return 'Paid';
        case 'all': return 'All Finance View';
        default: return 'Approved for Payment';
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8">Finance Dashboard</h1>

      <div className="flex space-x-1 border-b border-slate-200 mb-8">
        <Button variant={tab === 'approved_for_payment' ? 'secondary' : 'ghost'} className={`py-2 px-4 h-auto rounded-none border-b-2 ${tab === 'approved_for_payment' ? 'border-slate-700 text-slate-800 font-semibold' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700'}`} asChild>
          <Link href="?tab=approved_for_payment">For Payment</Link>
        </Button>
        <Button variant={tab === 'payment_processing' ? 'secondary' : 'ghost'} className={`py-2 px-4 h-auto rounded-none border-b-2 ${tab === 'payment_processing' ? 'border-slate-700 text-slate-800 font-semibold' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700'}`} asChild>
          <Link href="?tab=payment_processing">Processing</Link>
        </Button>
        <Button variant={tab === 'paid' ? 'secondary' : 'ghost'} className={`py-2 px-4 h-auto rounded-none border-b-2 ${tab === 'paid' ? 'border-slate-700 text-slate-800 font-semibold' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700'}`} asChild>
          <Link href="?tab=paid">Paid</Link>
        </Button>
        <Button variant={tab === 'all' ? 'secondary' : 'ghost'} className={`py-2 px-4 h-auto rounded-none border-b-2 ${tab === 'all' ? 'border-slate-700 text-slate-800 font-semibold' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700'}`} asChild>
          <Link href="?tab=all">All Finance View</Link>
        </Button>
      </div>
      
      <h2 className="text-xl font-semibold text-slate-700 mb-6">
        {getTabName(tab)}
      </h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
          <p className="font-semibold">Error Loading Requests</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {refundRequests.length === 0 && !error && (
         <div className="text-center py-16 bg-white rounded-lg shadow-md border border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h2 className="mt-5 text-xl font-semibold text-slate-700">No Refund Requests</h2>
          <p className="mt-2 text-sm text-slate-500">There are no requests matching the current filter: <span className="font-medium">{getTabName(tab)}</span>.</p>
        </div>
      )}
      {refundRequests.length > 0 && !error && (
        <FinanceTable refundRequests={refundRequests} actorName="Finance User (Bulk Op)" currentTab={tab} />
      )}

      {refundRequests.length > 0 && !error && (
        <PaginationControls totalItems={totalRequests} itemsPerPage={ITEMS_PER_PAGE} currentTab={tab} />
      )}
    </div>
  );
} 