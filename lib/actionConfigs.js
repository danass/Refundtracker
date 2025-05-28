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
  financeMarkPaid,
  financeHandlePaymentError
} from '@/actions/financeActions';

// Added import for admin action
import { adminUpdateStatus } from '@/actions/adminActions';

export const agentActionConfigurations = [
  {
    key: 'agentApprove',
    serverAction: agentApprove,
    buttonText: 'Approve',
    processingText: 'Processing Approval...',
    successText: 'Approval Processed',
    variant: 'outline',
    buttonClassName: 'text-green-700 border-green-500 hover:bg-green-50 hover:text-green-800 focus-visible:ring-green-400',
    commentFieldName: 'agentNotes',
    requiresComment: false,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS],
    requiredRole: 'agent',
  },
  {
    key: 'agentRequestInfo',
    serverAction: agentRequestInfo,
    buttonText: 'Request Info from Client',
    processingText: 'Updating...',
    successText: 'Info Requested',
    variant: 'outline',
    buttonClassName: 'text-blue-700 border-blue-500 hover:bg-blue-50 hover:text-blue-800 focus-visible:ring-blue-400',
    commentFieldName: 'agentNotes',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS],
    requiredRole: 'agent',
  },
  {
    key: 'agentEscalate',
    serverAction: agentEscalate,
    buttonText: 'Escalate to Lead',
    processingText: 'Escalating...',
    successText: 'Escalated',
    variant: 'outline',
    buttonClassName: 'text-amber-700 border-amber-500 hover:bg-amber-50 hover:text-amber-800 focus-visible:ring-amber-400',
    commentFieldName: 'agentNotes',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS],
    requiredRole: 'agent',
  },
  {
    key: 'agentReject',
    serverAction: agentReject,
    buttonText: 'Reject Refund',
    processingText: 'Rejecting...',
    successText: 'Rejected',
    variant: 'outline',
    buttonClassName: 'text-red-700 border-red-500 hover:bg-red-50 hover:text-red-800 focus-visible:ring-red-400',
    commentFieldName: 'rejectionReason',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS],
    requiredRole: 'agent',
  },
];

export const leadActionConfigurations = [
  {
    key: 'leadApprove',
    serverAction: leadApprove,
    // Dynamic buttonText will be handled in page.jsx for this specific action
    // buttonText: requestData.amount > SUPERVISOR_APPROVAL_THRESHOLD ? 'Approve & Escalate' : 'Approve (to Finance)',
    processingText: 'Approving...',
    successText: 'Approval Processed',
    variant: 'outline',
    buttonClassName: 'text-green-700 border-green-500 hover:bg-green-50 hover:text-green-800 focus-visible:ring-green-400',
    commentFieldName: 'leadComments',
    requiresComment: false,
    applicableStatuses: [RefundStatus.PENDING_LEAD_APPROVAL],
    requiredRole: 'lead', // or 'team_lead'
  },
  {
    key: 'leadReject',
    serverAction: leadReject,
    buttonText: 'Reject Refund',
    processingText: 'Rejecting...',
    successText: 'Rejected',
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
    buttonText: 'Return to Agent',
    processingText: 'Returning...',
    successText: 'Returned',
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
    buttonText: 'Final Approve (to Finance)',
    processingText: 'Approving...',
    successText: 'Approved for Payment',
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
    buttonText: 'Reject Refund (Final)',
    processingText: 'Rejecting...',
    successText: 'Rejected',
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
    buttonText: 'Initiate Payment',
    processingText: 'Initiating...',
    successText: 'Payment Initiated',
    variant: 'outline',
    buttonClassName: 'text-blue-700 border-blue-500 hover:bg-blue-50 hover:text-blue-800 focus-visible:ring-blue-400',
    commentFieldName: 'financeNotes',
    requiresComment: false,
    applicableStatuses: [RefundStatus.APPROVED_FOR_PAYMENT],
    requiredRole: 'finance',
  },
  {
    key: 'financeMarkPaid',
    serverAction: financeMarkPaid,
    buttonText: 'Confirm Payment & Mark Paid',
    processingText: 'Confirming...',
    successText: 'Marked Paid',
    variant: 'outline',
    buttonClassName: 'text-green-700 border-green-500 hover:bg-green-50 hover:text-green-800 focus-visible:ring-green-400',
    commentFieldName: 'financeNotes',
    requiresComment: false,
    applicableStatuses: [RefundStatus.PAYMENT_PROCESSING, RefundStatus.APPROVED_FOR_PAYMENT],
    requiredRole: 'finance',
  },
  {
    key: 'financeHandlePaymentError',
    serverAction: financeHandlePaymentError,
    buttonText: 'Flag Payment Issue / Retry',
    processingText: 'Handling Issue...',
    successText: 'Issue Handled',
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