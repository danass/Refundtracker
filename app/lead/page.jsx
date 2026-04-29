'use client';
import { RefundStatus } from '@prisma/client';
import PaginationControls from '@/components/PaginationControls';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, use } from 'react';
import LeadTableBody from '@/components/dashboard/LeadTableBody';

const ITEMS_PER_PAGE = 10;

export default function LeadDashboard({ searchParams: searchParamsProp }) {
  const router = useRouter();
  const searchParams = use(searchParamsProp);

  const [refundRequests, setRefundRequests] = useState([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [error, setError] = useState(null);
  const currentPage = Number(searchParams?.page) || 1;

  useEffect(() => {
    async function fetchData() {
      setError(null);
      try {
        const response = await fetch(`/api/refunds?role=lead&page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRefundRequests(data.requests || []);
        setTotalRequests(data.totalCount || 0);
      } catch (err) {
        setError(err.message || 'Impossible de charger les demandes.');
      }
    }
    fetchData();
  }, [currentPage]);

  if (error) {
    return <p className="p-6 text-red-500">{error}</p>;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">À valider</h1>
        <p className="text-sm text-gray-500 mt-0.5">Demandes en attente de votre validation</p>
      </div>

      {refundRequests.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <p className="text-gray-400 text-sm">Aucune demande en attente de validation.</p>
        </div>
      )}

      {refundRequests.length > 0 && (
        <div className="bg-white rounded-lg border overflow-x-auto" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <table className="min-w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mise à jour</th>
              </tr>
            </thead>
            <LeadTableBody refundRequests={refundRequests} />
          </table>
        </div>
      )}

      {refundRequests.length > 0 && (
        <PaginationControls totalItems={totalRequests} itemsPerPage={ITEMS_PER_PAGE} />
      )}
    </div>
  );
}
