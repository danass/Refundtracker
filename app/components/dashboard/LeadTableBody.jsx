'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { RefundStatus } from '@prisma/client';
import { getStatusVariant } from '@/lib/utils';

export default function LeadTableBody({ refundRequests }) {
  const router = useRouter();

  const handleRowClick = (requestId) => {
    router.push(`/refunds/${requestId}?simulatedRole=team_lead`);
  };

  return (
    <tbody className="bg-white divide-y divide-slate-200">
      {refundRequests.map((request) => (
        <tr 
          key={request.id} 
          className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
          onClick={() => handleRowClick(request.id)}
        >
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 hover:underline">
            {request.ticketId || request.id}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
            {request.clientFirstName} {request.clientLastName}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
            {request.currency === 'USD' ? '$' : request.currency === 'EUR' ? '€' : request.currency === 'GBP' ? '£' : ''}
            {typeof request.amount === 'number' ? request.amount.toFixed(2) : 'N/A'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge variant={getStatusVariant(request.status)} className="text-xs">
              {request.status ? request.status.replace(/_/g, ' ') : 'N/A'}
            </Badge>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            {new Date(request.updatedAt).toLocaleString()}
          </td>
        </tr>
      ))}
    </tbody>
  );
} 