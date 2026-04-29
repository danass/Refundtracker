import Link from 'next/link';
import { prisma } from '@/lib/prisma.js';
import { RefundStatus, UserRole } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStatusLabel } from '@/lib/utils';
import AgentTableBody from '@/components/dashboard/AgentTableBody';
import FilterButton from '@/components/ui/FilterButton';
import { Plus } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

async function getAgents() {
  try {
    const agents = await prisma.user.findMany({
      where: { role: UserRole.AGENT },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    return agents.map(agent => ({ value: agent.id, label: agent.name || agent.email }));
  } catch {
    return [];
  }
}

export default async function AgentDashboard({ searchParams: searchParamsInput }) {
  const searchParams = await searchParamsInput;

  let refundRequests = [];
  let totalRequests = 0;
  let error = null;
  const currentPage = Number(searchParams?.page) || 1;
  const searchQuery = searchParams?.q || '';
  const tab = searchParams?.tab || 'assigned';
  const statusFilter = searchParams?.status || '';
  const dateFilter = searchParams?.date || '';
  const amountFilter = searchParams?.amount || '';
  const agentFilter = searchParams?.agent || '';

  const agents = await getAgents();

  // Counts for tab badges
  const [countReady, countWaiting, countFlagged] = await Promise.all([
    prisma.refundRequest.count({ where: { status: RefundStatus.CLIENT_VALIDATED } }),
    prisma.refundRequest.count({ where: { status: RefundStatus.PENDING_AGENT_REVIEW } }),
    prisma.refundRequest.count({ where: { isFlagged: true, OR: [{ status: RefundStatus.PENDING_AGENT_REVIEW }, { status: RefundStatus.CLIENT_VALIDATED }, { status: RefundStatus.RETURNED_TO_AGENT_FOR_EDITS }] } }),
  ]);

  const statusOptions = Object.values(RefundStatus).map(status => ({ value: status, label: getStatusLabel(status) }));
  const dateOptions = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'this_week', label: 'Cette semaine' },
    { value: 'this_month', label: 'Ce mois' },
  ];
  const amountOptions = [
    { value: '0-100', label: '0 € – 100 €' },
    { value: '101-500', label: '101 € – 500 €' },
    { value: '501+', label: '501 € et +' },
  ];

  const whereConditions = [];

  if (tab === 'assigned') {
    whereConditions.push({
      OR: [
        { status: RefundStatus.PENDING_AGENT_REVIEW },
        { status: RefundStatus.RETURNED_TO_AGENT_FOR_EDITS },
        { status: RefundStatus.CLIENT_VALIDATED },
      ],
    });
  } else if (tab === 'ready') {
    whereConditions.push({ status: RefundStatus.CLIENT_VALIDATED });
  } else if (tab === 'waiting') {
    whereConditions.push({ status: RefundStatus.PENDING_AGENT_REVIEW });
  } else if (tab === 'flagged') {
    whereConditions.push({ isFlagged: true });
  }

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

  if (statusFilter) whereConditions.push({ status: statusFilter });
  if (agentFilter) whereConditions.push({ assignedAgentId: agentFilter });

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
    error = 'Impossible de charger les demandes. Veuillez réessayer.';
  }

  if (error) {
    return <p className="p-6 text-red-500">{error}</p>;
  }

  const tabs = [
    { id: 'ready',    label: 'IBAN reçu',       count: countReady,   dot: 'bg-emerald-400' },
    { id: 'waiting',  label: 'En attente IBAN',  count: countWaiting, dot: 'bg-amber-400' },
    { id: 'flagged',  label: 'Signalées',        count: countFlagged, dot: 'bg-red-400' },
    { id: 'assigned', label: 'Toutes à traiter', count: null,         dot: null },
    { id: 'all',      label: 'Toutes',           count: null,         dot: null },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes demandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Remboursements à traiter</p>
        </div>
        <Link
          href="/agent/new-refund"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-md shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle demande
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 gap-1" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        {tabs.map(t => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />}
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>{t.count}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="mb-5 space-y-3">
        <form method="GET" action="/agent" className="flex gap-2 items-center">
          <Input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Rechercher par client, ID..."
            className="max-w-xs"
          />
          {tab && <input type="hidden" name="tab" value={tab} />}
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {dateFilter && <input type="hidden" name="date" value={dateFilter} />}
          {amountFilter && <input type="hidden" name="amount" value={amountFilter} />}
          {agentFilter && <input type="hidden" name="agent" value={agentFilter} />}
          <Button type="submit" variant="outline" size="sm">Rechercher</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          <FilterButton label="Statut" options={statusOptions} selectedValue={statusFilter} paramName="status" />
          <FilterButton label="Date" options={dateOptions} selectedValue={dateFilter} paramName="date" />
          <FilterButton label="Montant" options={amountOptions} selectedValue={amountFilter} paramName="amount" />
          <FilterButton label="Agent" options={agents} selectedValue={agentFilter} paramName="agent" />
        </div>
      </div>

      {refundRequests.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <p className="text-gray-400 text-sm">Aucune demande ne correspond aux filtres actuels.</p>
        </div>
      )}

      {refundRequests.length > 0 && (
        <div className="bg-white rounded-lg border overflow-x-auto" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <table className="min-w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IBAN</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mise à jour</th>
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
