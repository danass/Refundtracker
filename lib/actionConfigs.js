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

export const agentActionConfigurations = [
  {
    key: 'agentApprove',
    serverAction: agentApprove,
    buttonText: 'Approve',
    processingText: 'Processing Approval...',
    successText: 'Approval Processed',
    variant: 'default',
    buttonClassName: 'bg-green-600 hover:bg-green-700 text-white',
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
    variant: 'default',
    buttonClassName: 'bg-blue-600 hover:bg-blue-700 text-white',
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
    variant: 'secondary',
    buttonClassName: 'bg-amber-500 hover:bg-amber-600 text-black',
    commentFieldName: 'agentNotes',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS],
    requiredRole: 'agent',
  },
  {
    key: 'agentReject',
    serverAction: agentReject,
    buttonText: 'Reject Refund',
    buttonClassName: 'bg-red-600 hover:bg-red-700 text-white',
    processingText: 'Rejecting...',
    successText: 'Rejected',
    variant: 'destructive',
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
    variant: 'default',
    buttonClassName: 'bg-green-600 hover:bg-green-700 text-white',
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
    buttonClassName: 'bg-red-600 hover:bg-red-700 text-white',
    successText: 'Rejected',
    variant: 'destructive',
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
    variant: 'secondary',
    buttonClassName: 'bg-amber-500 hover:bg-amber-600 text-black',
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
    variant: 'default',
    buttonClassName: 'bg-green-700 hover:bg-green-800 text-white',
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
    buttonClassName: 'bg-red-600 hover:bg-red-700 text-white',
    variant: 'destructive',
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
    variant: 'default',
    buttonClassName: 'bg-blue-600 hover:bg-blue-700 text-white',
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
    variant: 'default',
    buttonClassName: 'bg-green-700 hover:bg-green-800 text-white',
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
    variant: 'secondary',
    buttonClassName: 'bg-orange-500 hover:bg-orange-600 text-black',
    commentFieldName: 'financeNotes',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PAYMENT_PROCESSING, RefundStatus.ERROR_PROCESSING_PAYMENT],
    requiredRole: 'finance',
  },
];

// Export SUPERVISOR_APPROVAL_THRESHOLD to be used in page.jsx 