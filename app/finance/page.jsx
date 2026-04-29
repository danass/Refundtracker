import Link from 'next/link';
import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';
import FinanceTable from '@/components/dashboard/FinanceTable';

const ITEMS_PER_PAGE = 10;

const TABS = [
  { id: 'approved_for_payment', label: 'À payer', status: RefundStatus.APPROVED_FOR_PAYMENT },
  { id: 'payment_processing', label: 'En cours', status: RefundStatus.PAYMENT_PROCESSING },
  { id: 'paid', label: 'Payées', status: RefundStatus.PAID },
  { id: 'all', label: 'Tout voir' },
];

export default async function FinanceDashboard({ searchParams: searchParamsInput }) {
  const searchParams = await searchParamsInput;
  const currentPage = Number(searchParams?.page) || 1;
  const tab = searchParams?.tab || 'approved_for_payment';

  let refundRequests = [];
  let totalRequests = 0;
  let error = null;

  try {
    let whereClause = {};
    if (tab === 'approved_for_payment') whereClause.status = RefundStatus.APPROVED_FOR_PAYMENT;
    else if (tab === 'payment_processing') whereClause.status = RefundStatus.PAYMENT_PROCESSING;
    else if (tab === 'paid') whereClause.status = RefundStatus.PAID;
    else if (tab === 'all') {
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
      orderBy: { updatedAt: 'desc' },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    });
  } catch (err) {
    console.error('Database error fetching finance requests:', err);
    error = 'Impossible de charger les demandes. Veuillez réessayer.';
  }

  if (error) return <p className="p-6 text-red-500">{error}</p>;

  const currentTab = TABS.find(t => t.id === tab) || TABS[0];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
        <p className="text-sm text-gray-500 mt-0.5">Exécution des remboursements</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        {TABS.map(t => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {refundRequests.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <p className="text-gray-400 text-sm">Aucune demande pour ce filtre.</p>
        </div>
      )}

      {refundRequests.length > 0 && (
        <FinanceTable refundRequests={refundRequests} actorName="Finance (simulation)" currentTab={tab} />
      )}

      {refundRequests.length > 0 && (
        <PaginationControls totalItems={totalRequests} itemsPerPage={ITEMS_PER_PAGE} currentTab={tab} />
      )}
    </div>
  );
}
