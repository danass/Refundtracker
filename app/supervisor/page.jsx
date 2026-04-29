'use client';

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
import { getStatusLabel } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

function BulkApproveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Traitement...' : 'Approuver la sélection'}
    </Button>
  );
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
  const [bulkActionState, bulkActionDispatch] = useActionState(supervisorBulkApprove, initialBulkActionState);

  useEffect(() => {
    async function fetchData() {
      setError(null);
      try {
        const response = await fetch(`/api/refunds?role=supervisor&page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setRefundRequests(data.requests || []);
        setTotalRequests(data.totalCount || 0);
      } catch (err) {
        setError(err.message || 'Impossible de charger les demandes.');
      }
    }
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    if (bulkActionState?.message) {
      if (bulkActionState.successCount > 0 && bulkActionState.failureCount === 0) {
        toast.success('Approbation groupée réussie', { description: bulkActionState.message });
      } else if (bulkActionState.successCount > 0 && bulkActionState.failureCount > 0) {
        toast.warning('Approbation partiellement réussie', { description: bulkActionState.message });
      } else if (bulkActionState.failureCount > 0) {
        toast.error("Échec de l'approbation", { description: bulkActionState.message });
      } else if (bulkActionState.error) {
        toast.error('Erreur', { description: bulkActionState.error });
      } else {
        toast.info('Mise à jour', { description: bulkActionState.message });
      }
      setSelectedRequests([]);
      setSelectAll(false);
      async function refetch() {
        try {
          const r = await fetch(`/api/refunds?role=supervisor&page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
          const d = await r.json();
          setRefundRequests(d.requests || []);
          setTotalRequests(d.totalCount || 0);
        } catch { setError('Impossible de rafraîchir les données.'); }
      }
      refetch();
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
    if (checked) setSelectedRequests(prev => [...prev, id]);
    else { setSelectedRequests(prev => prev.filter(i => i !== id)); setSelectAll(false); }
  };

  useEffect(() => {
    const eligible = refundRequests.filter(r => r.status === RefundStatus.PENDING_FINAL_APPROVAL);
    setSelectAll(eligible.length > 0 && selectedRequests.length === eligible.length);
  }, [selectedRequests, refundRequests]);

  const handleRowClick = (id) => router.push(`/refunds/${id}?simulatedRole=supervisor`);

  if (error) return <p className="p-6 text-red-500">{error}</p>;

  const actorName = 'Superviseur (simulation)';

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approbations finales</h1>
        <p className="text-sm text-gray-500 mt-0.5">Demandes en attente de votre approbation</p>
      </div>

      <form action={bulkActionDispatch}>
        <input type="hidden" name="selectedIds" value={selectedRequests.join(',')} />
        <input type="hidden" name="actorName" value={actorName} />

        {selectedRequests.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-blue-800">{selectedRequests.length} demande(s) sélectionnée(s)</p>
            <div className="flex items-center gap-2">
              <Textarea
                name="supervisorNotes"
                placeholder="Note commune (optionnel)"
                rows={1}
                className="max-w-xs bg-white text-sm"
              />
              <BulkApproveButton />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border overflow-x-auto" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <table className="min-w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                <th className="px-4 py-3 text-left w-10">
                  <div onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      disabled={refundRequests.filter(r => r.status === RefundStatus.PENDING_FINAL_APPROVAL).length === 0}
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mise à jour</th>
              </tr>
            </thead>
            <tbody>
              {refundRequests.map(request => {
                const eligible = request.status === RefundStatus.PENDING_FINAL_APPROVAL;
                const selected = selectedRequests.includes(request.id);
                return (
                  <tr
                    key={request.id}
                    onClick={() => eligible && handleRowClick(request.id)}
                    className={`border-b transition-colors ${eligible ? 'cursor-pointer hover:bg-gray-50' : 'opacity-60 cursor-not-allowed'} ${selected ? 'bg-blue-50' : ''}`}
                    style={{ borderColor: 'hsl(220,13%,89%)' }}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={checked => handleSelectRequest(request.id, checked)}
                        disabled={!eligible}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{request.ticketId || request.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{request.clientFirstName} {request.clientLastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.currency === 'USD' ? '$' : request.currency === 'EUR' ? '€' : request.currency === 'GBP' ? '£' : ''}
                      {typeof request.amount === 'number' ? request.amount.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{getStatusLabel(request.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{new Date(request.updatedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </form>

      {refundRequests.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border mt-0" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <p className="text-gray-400 text-sm">Aucune demande en attente d'approbation finale.</p>
        </div>
      )}

      {totalRequests > 0 && (
        <PaginationControls totalItems={totalRequests} itemsPerPage={ITEMS_PER_PAGE} />
      )}
    </div>
  );
}
