import Link from 'next/link';
import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AgentTableBody from '@/components/dashboard/AgentTableBody';

const ITEMS_PER_PAGE = 10;

export default async function AgentDashboard({ searchParams: searchParamsInput }) {
  const searchParams = await searchParamsInput;

  let refundRequests = [];
  let totalRequests = 0;
  let error = null;
  const currentPage = Number(searchParams?.page) || 1;
  const searchQuery = searchParams?.q || '';
  const tab = searchParams?.tab || 'assigned';

  // Filtering logic
  const whereConditions = [];

  if (tab === 'assigned') {
    whereConditions.push({
      OR: [
        { status: RefundStatus.PENDING_AGENT_REVIEW },
        { status: RefundStatus.RETURNED_TO_AGENT_FOR_EDITS },
      ],
    });
  } else if (tab === 'flagged') {
    whereConditions.push({ isFlagged: true });
  } // For 'all' tab, no specific base condition is added to whereConditions

  if (searchQuery) {
    whereConditions.push({
      OR: [
        { clientFirstName: { contains: searchQuery, mode: 'insensitive' } },
        { clientLastName: { contains: searchQuery, mode: 'insensitive' } },
        { ticketId: { contains: searchQuery, mode: 'insensitive' } },
        { id: { contains: searchQuery, mode: 'insensitive' } },
      ],
    });
  }

  const finalWhere = whereConditions.length > 0 ? { AND: whereConditions } : {};

  try {
    totalRequests = await prisma.refundRequest.count({ where: finalWhere });
    refundRequests = await prisma.refundRequest.findMany({
      where: finalWhere,
      orderBy: { updatedAt: 'desc' },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    });
  } catch (err) {
    console.error('Database error fetching agent requests:', err);
    error = 'Failed to load refund requests. Please try again later.';
  }

  if (error) {
    return <p className="p-4 text-red-500">Error: {error}</p>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Agent Dashboard - Refunds</h1>
        <Link href="/agent/new-refund">
          <Button variant="default" className="bg-slate-800 hover:bg-slate-900 text-white">
            + New Refund Request
          </Button>
        </Link>
      </div>
      <div className="flex space-x-1 border-b border-slate-200 mb-6">
        <Button variant={tab === 'assigned' ? 'secondary' : 'ghost'} className={`py-2 px-3 h-auto rounded-none border-b-2 ${tab === 'assigned' ? 'border-slate-700 text-slate-800 font-semibold' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700'}`} asChild>
          <Link href="?tab=assigned">Assigned to Me</Link>
        </Button>
        <Button variant={tab === 'flagged' ? 'secondary' : 'ghost'} className={`py-2 px-3 h-auto rounded-none border-b-2 ${tab === 'flagged' ? 'border-slate-700 text-slate-800 font-semibold' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700'}`} asChild>
          <Link href="?tab=flagged">Flagged</Link>
        </Button>
        <Button variant={tab === 'all' ? 'secondary' : 'ghost'} className={`py-2 px-3 h-auto rounded-none border-b-2 ${tab === 'all' ? 'border-slate-700 text-slate-800 font-semibold' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700'}`} asChild>
          <Link href="?tab=all">All Requests</Link>
        </Button>
      </div>
      <div className="mb-6">
        <form method="GET" action="/agent" className="flex gap-3 items-center">
          <Input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search by client, ID..."
            className="max-w-sm border-slate-300 focus:border-slate-500 focus:ring-slate-500"
          />
          {tab && <input type="hidden" name="tab" value={tab} />}
          <Button type="submit" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
            Search
          </Button>
        </form>
      </div>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      {refundRequests.length === 0 && !error && (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="mt-2 text-lg font-medium text-slate-900">No Refund Requests Found</h2>
          <p className="mt-1 text-sm text-slate-500">No requests match your current filters.</p>
        </div>
      )}
      {refundRequests.length > 0 && !error && (
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Refund ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Info</th>
              </tr>
            </thead>
            <AgentTableBody refundRequests={refundRequests} simulatedRole="agent" />
          </table>
        </div>
      )}
      <PaginationControls totalItems={totalRequests} itemsPerPage={ITEMS_PER_PAGE} currentTab={tab} />
    </div>
  );
} 