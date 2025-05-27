// app/lib/actionConfigs.js
import { RefundStatus } from '@prisma/client';

// Import all server actions
import {
  agentApprove,
  agentEscalate,
  agentRequestInfo,
  agentReject,
  // Assuming createRefundRequestByAgent is also a server action you might want to list here if used in a similar panel
} from '@/actions/agentActions';

import {
  leadApprove,
  leadReject,
  leadReturnToAgent
} from '@/actions/leadActions';

import {
  supervisorApprove,
  supervisorReject,
} from '@/actions/supervisorActions';

import {
  financeTriggerPayment,
  financeMarkPaid,
  financeHandlePaymentError,
  // Assuming financeBulkProcess is also a server action
} from '@/actions/financeActions';

// Define and export SUPERVISOR_APPROVAL_THRESHOLD directly here
export const SUPERVISOR_APPROVAL_THRESHOLD = 1000; // Example value, adjust as needed

// export { SUPERVISOR_APPROVAL_THRESHOLD };

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
    key: 'agentEscalate',
    serverAction: agentEscalate,
    buttonText: 'Escalate to Lead',
    processingText: 'Escalating...',
    successText: 'Escalated to Lead',
    variant: 'default',
    commentFieldName: 'escalationReason',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS],
    requiredRole: 'agent',
  },
  {
    key: 'agentRequestInfo',
    serverAction: agentRequestInfo,
    buttonText: 'Request More Info (Client)',
    processingText: 'Sending Request...',
    successText: 'Information Request Sent',
    variant: 'outline',
    commentFieldName: 'informationRequestDetails',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS],
    requiredRole: 'agent',
  },
  {
    key: 'agentReject',
    serverAction: agentReject,
    buttonText: 'Reject Refund',
    processingText: 'Rejecting...',
    successText: 'Refund Rejected',
    variant: 'destructive',
    commentFieldName: 'rejectionReason',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS],
    requiredRole: 'agent',
  },
  // Add other agent actions if necessary
];

export const leadActionConfigurations = [
  {
    key: 'leadApprove',
    serverAction: leadApprove,
    buttonText: 'Approve',
    // Dynamic buttonText: 'Approve & Escalate' or 'Approve (to Finance)' will be handled in page.jsx
    processingText: 'Approving...',
    successText: 'Approval Processed',
    variant: 'default',
    buttonClassName: 'bg-green-600 hover:bg-green-700 text-white',
    commentFieldName: 'leadComments',
    requiresComment: false,
    applicableStatuses: [RefundStatus.PENDING_LEAD_APPROVAL],
    requiredRole: 'lead',
  },
  {
    key: 'leadReject',
    serverAction: leadReject,
    buttonText: 'Reject Refund',
    processingText: 'Rejecting...',
    successText: 'Refund Rejected by Lead',
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
    successText: 'Returned to Agent',
    variant: 'outline',
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
    commentFieldName: 'financeConfirmationNotes', // e.g. transaction ID
    requiresComment: false, // Can be true if you want to enforce a note
    applicableStatuses: [RefundStatus.PAYMENT_TRIGGERED],
    requiredRole: 'finance',
  },
  {
    key: 'financeHandlePaymentError',
    serverAction: financeHandlePaymentError,
    buttonText: 'Log Payment Error',
    processingText: 'Logging Error...',
    successText: 'Payment Error Logged',
    variant: 'destructive',
    commentFieldName: 'paymentErrorDetails',
    requiresComment: true,
    applicableStatuses: [RefundStatus.PAYMENT_TRIGGERED], // Or also APPROVED_FOR_PAYMENT if error happens before trigger
    requiredRole: 'finance',
  },
  // Add other finance actions if necessary
];

// Client-specific actions are usually handled differently (e.g. direct forms, not through this panel)
// But if you had a common structure for them:
// export const clientActionConfigurations = [ ... ]; 