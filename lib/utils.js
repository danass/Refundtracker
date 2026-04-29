import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { RefundStatus } from '@prisma/client';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  AWAITING_CLIENT_VALIDATION: 'En attente de validation client',
  CLIENT_VALIDATED: 'Validé par le client',
  PENDING_AGENT_REVIEW: 'En cours de traitement',
  RETURNED_TO_AGENT_FOR_EDITS: 'Renvoyé à l\'agent',
  RETURNED_TO_CLIENT_FOR_INFO: 'Informations demandées au client',
  PENDING_LEAD_APPROVAL: 'En attente responsable',
  PENDING_FINAL_APPROVAL: 'En attente superviseur',
  APPROVED_FOR_PAYMENT: 'Approuvé — à payer',
  PAYMENT_PROCESSING: 'Paiement en cours',
  PAID: 'Remboursé',
  REJECTED_BY_AGENT: 'Rejeté par l\'agent',
  REJECTED_BY_LEAD: 'Rejeté par le responsable',
  REJECTED_BY_SUPERVISOR: 'Rejeté par le superviseur',
  CANCELLED_BY_AGENT: 'Annulé par l\'agent',
  CANCELLED_BY_CLIENT: 'Annulé par le client',
  ERROR_PROCESSING_PAYMENT: 'Erreur de paiement',
};

export const getStatusLabel = (status) => {
  if (!status) return 'N/A';
  return STATUS_LABELS[status] || status.replace(/_/g, ' ');
};

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
