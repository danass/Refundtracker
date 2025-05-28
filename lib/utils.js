import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { RefundStatus } from '@prisma/client';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const getStatusVariant = (status) => {
  if (!status) return 'default';
  const s = status;
  if (s === RefundStatus.PENDING_AGENT_REVIEW) return 'agent-pending';
  if (s === RefundStatus.RETURNED_TO_AGENT_FOR_EDITS) return 'warning';
  if (s === RefundStatus.PENDING_LEAD_APPROVAL) return 'lead-pending';
  if (s === RefundStatus.PENDING_FINAL_APPROVAL) return 'supervisor-pending';
  if (s === RefundStatus.APPROVED_FOR_PAYMENT) return 'approved';
  if (s === RefundStatus.PAYMENT_PROCESSING) return 'processing';
  if (s === RefundStatus.PAID) return 'success';
  if (s === RefundStatus.AWAITING_CLIENT_VALIDATION || s === RefundStatus.RETURNED_TO_CLIENT_FOR_INFO) return 'client-action';
  if (s.includes('REJECT') || s.includes('CANCEL')) return 'destructive';
  return 'default';
};
