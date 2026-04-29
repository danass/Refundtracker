'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { RefundStatus } from '@prisma/client';
import { getStatusVariant, getStatusLabel } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function AgentTableBody({ refundRequests, simulatedRole = 'agent' }) {
  const router = useRouter();

  return (
    <tbody>
      {refundRequests.map(request => {
        const ibanReady = !!request.iban;
        const isClientValidated = request.status === RefundStatus.CLIENT_VALIDATED;
        const isPendingNoIban = request.status === RefundStatus.PENDING_AGENT_REVIEW && !ibanReady;

        return (
          <tr
            key={request.id}
            className="border-b cursor-pointer transition-colors hover:bg-gray-50"
            style={{ borderColor: 'hsl(220,13%,89%)', background: isClientValidated ? 'hsl(142,60%,98%)' : isPendingNoIban ? 'hsl(45,100%,98%)' : undefined }}
            onClick={() => router.push(`/refunds/${request.id}?simulatedRole=${simulatedRole}`)}
          >
            <td className="px-4 py-3 text-sm text-gray-700">
              {request.isFlagged && <span className="text-amber-500 mr-1" title="Signalée">⚠</span>}
              <Link
                href={`/refunds/${request.id}?simulatedRole=${simulatedRole}`}
                className="hover:underline font-medium"
                onClick={e => e.stopPropagation()}
              >
                {request.clientFirstName} {request.clientLastName}
              </Link>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 font-mono">
              {request.ticketId || request.id.slice(0, 8)}
            </td>
            <td className="px-4 py-3 text-sm font-medium text-gray-800">
              {request.currency === 'USD' ? '$' : request.currency === 'EUR' ? '€' : request.currency === 'GBP' ? '£' : ''}
              {typeof request.amount === 'number' ? request.amount.toFixed(2) : 'N/A'}
            </td>
            <td className="px-4 py-3">
              {ibanReady ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Fourni
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Manquant
                </span>
              )}
            </td>
            <td className="px-4 py-3">
              <Badge variant={getStatusVariant(request.status)} className="text-xs">
                {getStatusLabel(request.status)}
              </Badge>
            </td>
            <td className="px-4 py-3 text-sm text-gray-400">
              {request.updatedAt ? new Date(request.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
