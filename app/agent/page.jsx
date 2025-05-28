'use client';
import Link from 'next/link';
import { prisma } from '@/lib/prisma.js';
import { RefundStatus, UserRole } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AgentTableBody from '@/components/dashboard/AgentTableBody';
import FilterButton from '@/components/ui/FilterButton';
// import { useRouter, useSearchParams } from 'next/navigation'; // Keep commented for Server Component

const ITEMS_PER_PAGE = 10;

// Helper function to get unique agents
async function getAgents() {
  try {
    const agents = await prisma.user.findMany({
      where: { role: UserRole.AGENT },
      select: {
        id: true,
        name: true, // Assuming a 'name' field
        email: true // Fallback or primary identifier
      },
      orderBy: { name: 'asc' } // Or email, or another suitable field
    });
    return agents.map(agent => ({
      value: agent.id,
      label: agent.name || agent.email // Use name if available, else email
    }));
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return []; // Return empty array on error to prevent crashes
  }
}

// AgentDashboard is a Server Component, so we cannot use client-side hooks like useRouter directly here.
// The onValueChange handlers in FilterButton will use window.location.search for now.
export default async function AgentDashboard({ searchParams: searchParamsInput }) {
  // Await searchParams directly from props
  const searchParams = await searchParamsInput;

  let refundRequests = [];
  let totalRequests = 0;
  let error = null;
  const currentPage = Number(searchParams?.page) || 1;
  const searchQuery = searchParams?.q || '';
  const tab = searchParams?.tab || 'assigned';

  // Filter values from searchParams
  const statusFilter = searchParams?.status || '';
  const dateFilter = searchParams?.date || ''; // Placeholder, needs actual date handling
  const amountFilter = searchParams?.amount || ''; // Placeholder, needs actual amount handling
  const agentFilter = searchParams?.agent || '';

  const agents = await getAgents();

  const statusOptions = Object.values(RefundStatus).map(status => ({ value: status, label: status.replace(/_/g, ' ') }));
  // Placeholder options for Date and Amount - these would be more complex
  const dateOptions = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
  ];
  const amountOptions = [
    { value: '0-100', label: '$0 - $100' },
    { value: '101-500', label: '$101 - $500' },
    { value: '501+', label: '$501+' },
  ];

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

  // Apply filters to whereConditions
  if (statusFilter) {
    whereConditions.push({ status: statusFilter });
  }
  // TODO: Implement proper date filtering based on dateFilter value
  // if (dateFilter) { ... }
  // TODO: Implement proper amount filtering based on amountFilter value
  // if (amountFilter) { ... }
  if (agentFilter) {
    // This assumes you have an `agentId` or similar field on RefundRequest
    // and that agentFilter value is the agent's ID.
    whereConditions.push({ agentId: agentFilter }); 
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
        <Link href="/agent/new-refund" >
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
        <form method="GET" action="/agent" className="flex gap-3 items-center mb-4">
          <Input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search by client, ID..."
            className="max-w-sm border-slate-300 focus:border-slate-500 focus:ring-slate-500"
          />
          {tab && <input type="hidden" name="tab" value={tab} />}
          {/* Hidden inputs to carry over filter values on search submit */} 
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {dateFilter && <input type="hidden" name="date" value={dateFilter} />}
          {amountFilter && <input type="hidden" name="amount" value={amountFilter} />}
          {agentFilter && <input type="hidden" name="agent" value={agentFilter} />}

          <Button type="submit" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
            Search
          </Button>
        </form>
        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <FilterButton
            label="Status"
            options={statusOptions}
            selectedValue={statusFilter}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams);
              if (value) params.set('status', value); else params.delete('status');
              params.set('page', '1');
              window.location.search = params.toString();
            }}
          />
          <FilterButton
            label="Date"
            options={dateOptions}
            selectedValue={dateFilter}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams);
              if (value) params.set('date', value); else params.delete('date');
              params.set('page', '1');
              window.location.search = params.toString();
            }}
          />
          <FilterButton
            label="Amount"
            options={amountOptions}
            selectedValue={amountFilter}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams);
              if (value) params.set('amount', value); else params.delete('amount');
              params.set('page', '1');
              window.location.search = params.toString();
            }}
          />
          <FilterButton
            label="Agent"
            options={agents}
            selectedValue={agentFilter}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams);
              if (value) params.set('agent', value); else params.delete('agent');
              params.set('page', '1');
              window.location.search = params.toString();
            }}
          />
        </div>
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