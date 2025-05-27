'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { RefundStatus } from '@prisma/client'; // Ensure this is available or pass variants

export default function AgentTableBody({ refundRequests, simulatedRole = 'agent' }) {
  const router = useRouter();

  const handleRowClick = (requestId) => {
    router.push(`/refunds/${requestId}?simulatedRole=${simulatedRole}`);
  };

  const getStatusVariant = (status) => {
    if (!status) return 'default';
    const s = status;
    if (s === RefundStatus.PENDING_AGENT_REVIEW) return 'agent-pending';
    if (s === RefundStatus.RETURNED_TO_AGENT_FOR_EDITS) return 'warning';
    if (s === RefundStatus.PENDING_LEAD_APPROVAL) return 'lead-pending';
    // Add other statuses as needed from the original page
    if (s === RefundStatus.PENDING_FINAL_APPROVAL) return 'supervisor-pending';
    if (s === RefundStatus.APPROVED_FOR_PAYMENT) return 'approved';
    if (s === RefundStatus.PAYMENT_PROCESSING) return 'processing';
    if (s === RefundStatus.PAID) return 'success';
    if (s === RefundStatus.AWAITING_CLIENT_VALIDATION || s === RefundStatus.RETURNED_TO_CLIENT_FOR_INFO) return 'client-action';
    if (s.includes('REJECT') || s.includes('CANCEL')) return 'destructive';
    return 'default';
  };

  return (
    <tbody className="bg-white divide-y divide-slate-200">
      {refundRequests.map((request) => (
        <tr 
          key={request.id} 
          className={`hover:bg-slate-100 cursor-pointer transition-colors duration-150 ${request.isFlagged ? 'bg-red-50 hover:bg-red-100' : ''}`}
          onClick={() => handleRowClick(request.id)}
        >
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
            {request.isFlagged && <span title="Flagged Request" className="text-red-500 mr-1">⚠️</span>}
            {/* Existing Link for name, stop propagation to allow specific link click if preferred over row click */}
            <Link 
              href={`/refunds/${request.id}?simulatedRole=${simulatedRole}`} 
              className="hover:underline hover:text-slate-900"
              onClick={(e) => e.stopPropagation()} // Important to prevent double navigation if row click also fires
            >
              {request.clientFirstName} {request.clientLastName}
            </Link>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
            {/* Existing Link for ID, stop propagation */}
            <Link 
              href={`/refunds/${request.id}?simulatedRole=${simulatedRole}`} 
              className="hover:underline hover:text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              {request.ticketId || request.id}
            </Link>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
            {request.currency === 'USD' ? '$' : request.currency === 'EUR' ? '€' : request.currency === 'GBP' ? '£' : ''}
            {typeof request.amount === 'number' ? request.amount.toFixed(2) : 'N/A'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge variant={getStatusVariant(request.status)} className="text-xs">
              {request.status ? request.status.replace(/_/g, ' ') : 'N/A'}
            </Badge>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            {request.updatedAt ? new Date(request.updatedAt).toLocaleString() : 'N/A'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-xs" title={request.riskTriggers || 'No specific risk triggers noted'}>
            {request.riskTriggers || '-'}
          </td>
        </tr>
      ))}
    </tbody>
  );
} 