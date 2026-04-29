import { RefundStatus } from '@prisma/client';

// Import all server actions
import {
  agentApprove,
  agentEscalate,
  agentRequestInfo,
  agentReject
} from '@/actions/agentActions';

import {
  leadApprove,
  leadReject,
  leadReturnToAgent,
  SUPERVISOR_APPROVAL_THRESHOLD
} from '@/actions/leadActions';

import {
  supervisorApprove,
  supervisorReject
} from '@/actions/supervisorActions';

import {
  financeTriggerPayment,
  financeReject,
  financeHandlePaymentError
} from '@/actions/financeActions';

// Added import for admin action
import { adminUpdateStatus } from '@/actions/adminActions';

export const agentActionConfigurations = [
  {
    key: 'agentApprove',
    serverAction: agentApprove,
    buttonText: 'Approuver',
    processingText: 'Traitement...',
    successText: 'Approuvé',
    variant: 'outline',
    buttonClassName: 'text-green-700 border-green-500 hover:bg-green-50 hover:text-green-800 focus-visible:ring-green-400',
    commentFieldName: 'agentNotes',
    requiresComment: false,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS, RefundStatus.CLIENT_VALIDATED],
    requiredRole: 'agent',
  },
  {
    key: 'agentRequestInfo',
    serverAction: agentRequestInfo,
    buttonText: 'Demander info au client',
    processingText: 'Mise à jour...',
    successText: 'Info demandée',
    variant: 'outline',
    buttonClassName: 'text-blue-700 border-blue-500 hover:bg-blue-50 hover:text-blue-800 focus-visible:ring-blue-400',
    commentFieldName: 'agentNotes',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS, RefundStatus.CLIENT_VALIDATED],
    requiredRole: 'agent',
  },
  {
    key: 'agentEscalate',
    serverAction: agentEscalate,
    buttonText: 'Escalader au responsable',
    processingText: 'Escalade...',
    successText: 'Escaladé',
    variant: 'outline',
    buttonClassName: 'text-amber-700 border-amber-500 hover:bg-amber-50 hover:text-amber-800 focus-visible:ring-amber-400',
    commentFieldName: 'agentNotes',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS, RefundStatus.CLIENT_VALIDATED],
    requiredRole: 'agent',
  },
  {
    key: 'agentReject',
    serverAction: agentReject,
    buttonText: 'Rejeter le remboursement',
    processingText: 'Rejet...',
    successText: 'Rejeté',
    variant: 'outline',
    buttonClassName: 'text-red-700 border-red-500 hover:bg-red-50 hover:text-red-800 focus-visible:ring-red-400',
    commentFieldName: 'rejectionReason',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS, RefundStatus.CLIENT_VALIDATED],
    requiredRole: 'agent',
  },
];

export const leadActionConfigurations = [
  {
    key: 'leadApprove',
    serverAction: leadApprove,
    // Dynamic buttonText will be handled in page.jsx for this specific action
    // buttonText: requestData.amount > SUPERVISOR_APPROVAL_THRESHOLD ? 'Approve & Escalate' : 'Approve (to Finance)',
    processingText: 'Approbation...',
    successText: 'Approuvé',
    variant: 'outline',
    buttonClassName: 'text-green-700 border-green-500 hover:bg-green-50 hover:text-green-800 focus-visible:ring-green-400',
    commentFieldName: 'leadComments',
    requiresComment: false,
    applicableStatuses: [RefundStatus.PENDING_LEAD_APPROVAL],
    requiredRole: 'lead',
  },
  {
    key: 'leadReject',
    serverAction: leadReject,
    buttonText: 'Rejeter le remboursement',
    processingText: 'Rejet...',
    successText: 'Rejeté',
    variant: 'outline',
    buttonClassName: 'text-red-700 border-red-500 hover:bg-red-50 hover:text-red-800 focus-visible:ring-red-400',
    commentFieldName: 'rejectionReason',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_LEAD_APPROVAL],
    requiredRole: 'lead',
  },
  {
    key: 'leadReturnToAgent',
    serverAction: leadReturnToAgent,
    buttonText: 'Renvoyer à l\'agent',
    processingText: 'Renvoi...',
    successText: 'Renvoyé',
    variant: 'outline',
    buttonClassName: 'text-amber-700 border-amber-500 hover:bg-amber-50 hover:text-amber-800 focus-visible:ring-amber-400',
    commentFieldName: 'returnReason',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_LEAD_APPROVAL],
    requiredRole: 'lead',
  },
];

export const supervisorActionConfigurations = [
  {
    key: 'supervisorApprove',
    serverAction: supervisorApprove,
    buttonText: 'Approbation finale (vers finance)',
    processingText: 'Approbation...',
    successText: 'Approuvé pour paiement',
    variant: 'outline',
    buttonClassName: 'text-green-700 border-green-500 hover:bg-green-50 hover:text-green-800 focus-visible:ring-green-400',
    commentFieldName: 'supervisorNotes',
    requiresComment: false,
    applicableStatuses: [RefundStatus.PENDING_FINAL_APPROVAL],
    requiredRole: 'supervisor',
  },
  {
    key: 'supervisorReject',
    serverAction: supervisorReject,
    buttonText: 'Rejeter (définitif)',
    processingText: 'Rejet...',
    successText: 'Rejeté',
    variant: 'outline',
    buttonClassName: 'text-red-700 border-red-500 hover:bg-red-50 hover:text-red-800 focus-visible:ring-red-400',
    commentFieldName: 'rejectionReason',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_FINAL_APPROVAL],
    requiredRole: 'supervisor',
  },
];

export const financeActionConfigurations = [
  {
    key: 'financeTriggerPayment',
    serverAction: financeTriggerPayment,
    buttonText: 'Initier le paiement',
    processingText: 'Initiation...',
    successText: 'Paiement initié',
    variant: 'outline',
    buttonClassName: 'text-blue-700 border-blue-500 hover:bg-blue-50 hover:text-blue-800 focus-visible:ring-blue-400',
    commentFieldName: 'financeNotes',
    requiresComment: false,
    applicableStatuses: [RefundStatus.APPROVED_FOR_PAYMENT],
    requiredRole: 'finance',
  },
  {
    key: 'financeReject',
    serverAction: financeReject,
    buttonText: 'Refuser le paiement (retour responsable)',
    processingText: 'Renvoi...',
    successText: 'Renvoyé au responsable',
    variant: 'outline',
    buttonClassName: 'text-red-700 border-red-500 hover:bg-red-50 hover:text-red-800 focus-visible:ring-red-400',
    commentFieldName: 'financeNotes',
    requiresComment: true,
    applicableStatuses: [RefundStatus.APPROVED_FOR_PAYMENT],
    requiredRole: 'finance',
  },
  {
    key: 'financeHandlePaymentError',
    serverAction: financeHandlePaymentError,
    buttonText: 'Signaler un problème / Réessayer',
    processingText: 'Traitement...',
    successText: 'Problème traité',
    variant: 'outline',
    buttonClassName: 'text-orange-600 border-orange-500 hover:bg-orange-50 hover:text-orange-700 focus-visible:ring-orange-400',
    commentFieldName: 'financeNotes',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PAYMENT_PROCESSING, RefundStatus.ERROR_PROCESSING_PAYMENT],
    requiredRole: 'finance',
  },
];

// Added adminActionConfigurations
export const adminActionConfigurations = Object.values(RefundStatus).map(status => ({
  key: `adminSet${status.replace(/_/g, '')}`,
  serverAction: adminUpdateStatus, // This action needs to be created
  buttonText: `Set to: ${status.replace(/_/g, ' ')}`,
  processingText: 'Updating Status...',
  successText: 'Status Updated',
  variant: 'outline',
  buttonClassName: 'text-purple-700 border-purple-500 hover:bg-purple-50 hover:text-purple-800 focus-visible:ring-purple-400', // Example styling
  commentFieldName: 'adminNotes', // Assuming a general notes field for admin actions
  requiresComment: true, // Or false, depending on requirements
  targetStatus: status, // To pass the target status to the server action
  applicableStatuses: Object.values(RefundStatus), // Admin can change from any status
  requiredRole: 'admin',
}));

// Export SUPERVISOR_APPROVAL_THRESHOLD to be used in page.jsx 