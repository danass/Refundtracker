'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { RefundStatus } from '@prisma/client';
import { getStatusVariant, getStatusLabel } from '@/lib/utils';

export default function LeadTableBody({ refundRequests }) {
  const router = useRouter();

  const handleRowClick = (requestId) => {
    router.push(`/refunds/${requestId}?simulatedRole=team_lead`);
  };

  return (
    <tbody>
      {refundRequests.map(request => (
        <tr
          key={request.id}
          className="border-b cursor-pointer transition-colors hover:bg-gray-50"
          style={{ borderColor: 'hsl(220,13%,89%)' }}
          onClick={() => handleRowClick(request.id)}
        >
          <td className="px-4 py-3 text-sm font-medium text-gray-900">{request.ticketId || request.id}</td>
          <td className="px-4 py-3 text-sm text-gray-600">{request.clientFirstName} {request.clientLastName}</td>
          <td className="px-4 py-3 text-sm text-gray-600">
            {request.currency === 'USD' ? '$' : request.currency === 'EUR' ? '€' : request.currency === 'GBP' ? '£' : ''}
            {typeof request.amount === 'number' ? request.amount.toFixed(2) : 'N/A'}
          </td>
          <td className="px-4 py-3">
            <Badge variant={getStatusVariant(request.status)} className="text-xs">
              {getStatusLabel(request.status)}
            </Badge>
          </td>
          <td className="px-4 py-3 text-sm text-gray-400">{new Date(request.updatedAt).toLocaleString()}</td>
        </tr>
      ))}
    </tbody>
  );
} 