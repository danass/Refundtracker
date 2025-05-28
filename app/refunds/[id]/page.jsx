// 'use client'; // This page should be a Server Component
import { prisma } from '@/lib/prisma.js';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
// Button might still be used by BackButton or other general UI here
// import { Button } from '@/components/ui/button'; 
import { getRefundRequestWithHistory } from '@/lib/query';
import { notFound } from 'next/navigation';
import ClientSubmitInfoForm from '@/components/refund-actions/ClientSubmitInfoForm';
// ClientEditDetailsForm is now used within ClientValidationAndEditForm or standalone for other statuses
import ClientEditDetailsForm from '@/components/refund-actions/ClientEditDetailsForm'; 
import ActionsPanel from '@/components/refund-actions/ActionsPanel';
import NoteDisplayItem from '@/components/NoteDisplayItem';
import UpdateInternalNotesForm from '@/components/refund-actions/UpdateInternalNotesForm';
import { RefundStatus } from '@prisma/client'; // This is fine in Server Components
import {
  agentActionConfigurations,
  leadActionConfigurations,
  supervisorActionConfigurations,
  financeActionConfigurations,
  adminActionConfigurations
} from '@/lib/actionConfigs.js';
import { AlertTriangle, InfoIcon } from 'lucide-react'; // ArrowLeft might be in BackButton
import Tooltip from '@/components/ui/Tooltip';
import { getStatusVariant } from '@/lib/utils';
import BackButton from '@/components/ui/BackButton';

// Import the new Client Component for the combined form
import ClientValidationAndEditForm from '@/components/refund-actions/ClientValidationAndEditForm';
// InfoCard is assumed to be a general UI component, ensure it's correctly located or defined.
// If InfoCard is defined in this file, it needs to be extracted if it uses client hooks or passed as children to client components.
// For now, assuming it's a simple presentational component or correctly structured.

// Removed client-specific hooks from page component:
// import { useActionState, useEffect, useState, useTransition } from 'react';
// import { clientValidateRequest } from '@/actions/clientActions'; 
// import { toast } from 'sonner';
// import { useFormStatus } from 'react-dom';

import { InfoCard } from '@/components/ui/InfoCard'; // Updated import path

function getDashboardPath(role) {
  switch (role) {
    case 'agent': return '/agent';
    case 'lead':
    case 'team_lead': return '/lead';
    case 'supervisor': return '/supervisor';
    case 'finance': return '/finance';
    case 'client': return '/client'; 
    default: return '/';
  }
}

// InfoCard definition removed from here

function InfoItem({ label, value, isBadge, badgeVariant = 'default', children }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-start">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900 col-span-2 flex items-center space-x-2">
        {isBadge ? (
          <Badge variant={badgeVariant} className="text-xs">
            {value ? String(value).replace(/_/g, ' ') : 'N/A'}
          </Badge>
        ) : (
          value || 'N/A'
        )}
        {children}
      </dd>
    </div>
  );
}

function JourneyItem({ entry, isLast }) {
    const getTimelineColor = (status) => {
      if (!status) return 'bg-gray-400';
      if (status.includes('REJECT') || status.includes('CANCEL')) return 'bg-red-500';
      if (status.includes('PAID') || status.includes('APPROVE')) return 'bg-green-500';
      if (status.includes('AWAITING') || status.includes('PENDING')) return 'bg-yellow-500';
      if (status.includes('RETURNED') || status.includes('ESCALATE')) return 'bg-orange-500';
      return 'bg-gray-400'; 
    };
  return (
    <li className="relative pl-5 pr-2 py-1 mb-4"> 
      <div 
        className={`absolute left-0 top-[0.5rem] w-3 h-3 ${getTimelineColor(entry.newStatus || entry.actionDescription || 'DEFAULT')} rounded-full border-2 border-white shadow-sm`}
      ></div>
      {!isLast && (
        <div 
          className={`absolute left-[5px] w-[2px] top-[calc(0.5rem_+_12px)] bottom-[-0.5rem] ${getTimelineColor(entry.newStatus || entry.actionDescription || 'DEFAULT')}`} 
        ></div>
      )}
      <div className="ml-3">
        <time className="mb-1 text-xs font-normal leading-none text-slate-400">
          {(entry.createdAt && !isNaN(new Date(entry.createdAt).valueOf())) ? new Date(entry.createdAt).toLocaleString() : 'Date N/A'} by {entry.changedBy || 'System'}
        </time>
        <h3 className="text-sm font-semibold text-slate-800 mt-0.5">
          Status changed to: <span className="font-bold">{entry.newStatus ? entry.newStatus.replace(/_/g, ' ') : (entry.actionDescription || 'Update')}</span>
          {entry.newStatus && entry.oldStatus && <span className="text-xs text-slate-500"> (from {entry.oldStatus.replace(/_/g, ' ')})</span>}
        </h3>
        {(entry.notes) && 
          <p className="text-xs italic text-slate-600 mt-1 bg-slate-50 p-2 rounded-md border border-slate-200">
            Details: "{entry.notes}"
          </p>
        }
      </div>
    </li>
  );
}

// Removed ClientValidationAndEditForm from here, it's now imported

export default async function RefundRequestDetail({ params, searchParams: searchParamsProp }) {
  // ... (initial data fetching and variable setup remains the same)
  const searchParams = await searchParamsProp;
  const simulatedRole = searchParams?.simulatedRole || 'client';
  const actorName = `Simulated ${simulatedRole.charAt(0).toUpperCase() + simulatedRole.slice(1)}`;
  const { id } = await params;

  const refundRequest = await getRefundRequestWithHistory(id);

  if (!refundRequest) {
    notFound();
  }

  const requestData = { ...refundRequest };
  requestData.currencySymbol = requestData.currency === 'USD' ? '$' : requestData.currency === 'EUR' ? '€' : requestData.currency === 'GBP' ? '£' : '';

  const isClientAddressMismatch = requestData.clientAddress !== requestData.originalClientAddress;
  const isClientFirstNameMismatch = requestData.clientFirstName !== requestData.originalClientFirstName;
  const isClientLastNameMismatch = requestData.clientLastName !== requestData.originalClientLastName;

  const hasAgentNotes = requestData.agentNotes && requestData.agentNotes.trim() !== '';
  const hasClientValidationDetails = requestData.clientValidationDetails && requestData.clientValidationDetails.trim() !== '';
  const hasLeadComments = requestData.leadComments && requestData.leadComments.trim() !== '';
  const hasSupervisorNotes = requestData.supervisorNotes && requestData.supervisorNotes.trim() !== '';
  const hasFinanceNotes = requestData.financeNotes && requestData.financeNotes.trim() !== '';
  const hasRejectionReason = requestData.rejectionReason && requestData.rejectionReason.trim() !== '';
  const hasAnyNotes = hasAgentNotes || hasClientValidationDetails || hasLeadComments || hasSupervisorNotes || hasFinanceNotes || hasRejectionReason;

  const isClientView = simulatedRole === 'client';
  const isAgentView = simulatedRole === 'agent';
  const isLeadView = simulatedRole === 'team_lead' || simulatedRole === 'lead';
  const isSupervisorView = simulatedRole === 'supervisor';
  const isFinanceView = simulatedRole === 'finance';
  const isAdminView = simulatedRole === 'admin';

  let availableActions = [];
  if (!isClientView) {
    const allActionConfigs = [
      ...agentActionConfigurations,
      ...leadActionConfigurations,
      ...supervisorActionConfigurations,
      ...financeActionConfigurations,
      ...(isAdminView ? adminActionConfigurations : [])
    ];
    availableActions = allActionConfigs.filter(config => {
      let roleMatch = false;
      if (config.requiredRole === 'agent' && isAgentView) roleMatch = true;
      else if ((config.requiredRole === 'lead' || config.requiredRole === 'team_lead') && isLeadView) roleMatch = true;
      else if (config.requiredRole === 'supervisor' && isSupervisorView) roleMatch = true;
      else if (config.requiredRole === 'finance' && isFinanceView) roleMatch = true;
      else if (config.requiredRole === 'admin' && isAdminView) roleMatch = true;
      if (!roleMatch) return false;
      return config.applicableStatuses.includes(requestData.status);
    }).map(config => {
      if (config.key === 'leadApprove') { 
        return {
          ...config,
          buttonText: 'Approve (to Finance)',
        };
      }
      return config;
    });
  }
  
  const terminalStatuses = [
    RefundStatus.PAID,
    RefundStatus.REJECTED_BY_AGENT,
    RefundStatus.REJECTED_BY_LEAD,
    RefundStatus.REJECTED_BY_SUPERVISOR,
    RefundStatus.CANCELLED_BY_CLIENT,
    RefundStatus.CANCELLED_BY_AGENT
  ];
  const showActionsPanel = (isAgentView || isLeadView || isSupervisorView || isFinanceView || isAdminView) &&
    requestData.status &&
    !terminalStatuses.includes(requestData.status);

  const auditLogToDisplay = (requestData.auditLogs || []).map(log => ({
    createdAt: log.timestamp,
    changedBy: log.actorName || 'System',
    newStatus: log.newStatus,
    oldStatus: log.previousStatus,
    notes: log.fieldChanges,
    actionDescription: log.actionDescription
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const displayData = {
    "Request ID (Internal)": requestData.ticketId || requestData.id,
    "Zendesk Ticket ID": requestData.zendeskTicketId, 
    "Client Name": `${requestData.clientFirstName} ${requestData.clientLastName}`,
    "Client Email": requestData.clientEmail,
    "Client Address": requestData.clientAddress,
    "Amount": `${requestData.currency} ${requestData.amount.toFixed(2)}`,
    "Original Order Amount": requestData.originalOrderAmount ? `${requestData.currency} ${requestData.originalOrderAmount.toFixed(2)}` : 'N/A',
    "Reason": requestData.reason,
    "Payment Method": requestData.paymentMethod,
    "Payment Provider Tx ID": requestData.paymentProviderTransactionId,
    "IBAN": requestData.iban,
    "BIC/SWIFT": requestData.bic,
    "Bank Name": requestData.bankName, 
    "Bank Address": requestData.bankAddress, 
    "Created At": new Date(requestData.createdAt).toLocaleString(),
    "Last Updated": new Date(requestData.updatedAt).toLocaleString(),
    "Created By Role": requestData.createdByRole,
    "Flagged": requestData.isFlagged ? 'Yes' : 'No',
    "Risk Triggers": requestData.riskTriggers,
    "Paid At": requestData.paidAt ? new Date(requestData.paidAt).toLocaleString() : 'N/A',
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-4">
        <BackButton 
          buttonText={`Back to ${simulatedRole.charAt(0).toUpperCase() + simulatedRole.slice(1)} Dashboard`}
        />
      </div>
      <header className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Refund Request: <span className="text-slate-600">{requestData.ticketId || requestData.id}</span>
          </h1>
          <Badge variant={getStatusVariant(requestData.status)} className="text-base px-3 py-1">
            {requestData.status ? requestData.status.replace(/_/g, ' ') : 'N/A'}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">Simulated Role: <span className="font-medium text-slate-700">{actorName}</span></p>
         {!isClientView && requestData.isFlagged && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-md flex items-center text-yellow-700 text-sm">
                <AlertTriangle size={18} className="mr-2 text-yellow-600" />
                <strong>Flagged Request:</strong> {requestData.riskTriggers || 'Review required due to internal flagging rules.'}
            </div>
        )}
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Client-specific forms Logic Updated */}
          {isClientView && requestData.status === RefundStatus.AWAITING_CLIENT_VALIDATION && (
            // Use the new imported Client Component
            <ClientValidationAndEditForm refundRequest={requestData} actorName={actorName} />
          )}
          {isClientView && requestData.status === RefundStatus.RETURNED_TO_CLIENT_FOR_INFO && (
            <>
              <InfoCard title="Update Your Details (IBAN/BIC/Address)"> 
                <ClientEditDetailsForm requestData={requestData} actorName={actorName} asStandaloneForm={true} />
              </InfoCard>
              <ClientSubmitInfoForm refundRequest={requestData} actorName={actorName} />
            </>
          )}
          {isClientView && (requestData.status === RefundStatus.DRAFT) && ( 
             <InfoCard title="Edit Your Draft Details (IBAN/BIC/Address)">
               <ClientEditDetailsForm requestData={requestData} actorName={actorName} asStandaloneForm={true} />
             </InfoCard>
          )}

          <InfoCard title="Refund Request Details">
            <InfoItem label="Request ID" value={requestData.ticketId || requestData.id} />
            <InfoItem label="Client First Name" value={requestData.clientFirstName}>
              {isClientFirstNameMismatch && (
                <Tooltip text="First name differs from original payment">
                  <AlertTriangle size={16} className="ml-2 text-orange-500" />
                </Tooltip>
              )}
            </InfoItem>
            <InfoItem label="Client Last Name" value={requestData.clientLastName}>
              {isClientLastNameMismatch && (
                <Tooltip text="Last name differs from original payment">
                  <AlertTriangle size={16} className="ml-2 text-orange-500" />
                </Tooltip>
              )}
            </InfoItem>
            <InfoItem label="Client Email" value={requestData.clientEmail} />
            {requestData.clientAddress && (
              <InfoItem label="Client Address (for refund)" value={requestData.clientAddress}>
                {isClientAddressMismatch && (
                  <Tooltip text="Address differs from original billing address">
                    <InfoIcon size={16} className="ml-2 text-blue-500" />
                  </Tooltip>
                )}
              </InfoItem>
            )}
            <InfoItem 
              label="Amount" 
              value={<span className="font-bold text-md">{`${requestData.currencySymbol}${requestData.amount?.toFixed(2)} ${requestData.currency}`}</span>}
            >
              {requestData.originalOrderAmount != null && requestData.amount > requestData.originalOrderAmount && (
                <Tooltip text={`Amount requested (${requestData.currencySymbol}${requestData.amount}) is MORE than original payment (${requestData.currencySymbol}${requestData.originalOrderAmount}).`}>
                  <AlertTriangle size={16} className="ml-2 text-yellow-500" />
                </Tooltip>
              )}
              {requestData.originalOrderAmount != null && requestData.amount < requestData.originalOrderAmount && (
                <Tooltip text={`Amount requested (${requestData.currencySymbol}${requestData.amount}) is LESS than original payment (${requestData.currencySymbol}${requestData.originalOrderAmount}).`}>
                  <InfoIcon size={16} className="ml-2 text-green-500" />
                </Tooltip>
              )}
              {requestData.originalOrderAmount != null && requestData.amount === requestData.originalOrderAmount && (
                <Tooltip text={`Amount requested (${requestData.currencySymbol}${requestData.amount}) is EQUAL to original payment (${requestData.currencySymbol}${requestData.originalOrderAmount}).`}>
                  <InfoIcon size={16} className="ml-2 text-slate-500" />
                </Tooltip>
              )}
            </InfoItem>
            <InfoItem label="Reason for Refund" value={requestData.reason} />
            <InfoItem label="Status" value={requestData.status} isBadge={true} badgeVariant={getStatusVariant(requestData.status)} />
            <InfoItem label="Created At" value={new Date(requestData.createdAt).toLocaleString()} />
            <InfoItem label="Last Updated" value={new Date(requestData.updatedAt).toLocaleString()} />
            {requestData.paidAt && <InfoItem label="Paid At" value={new Date(requestData.paidAt).toLocaleString()} />} 
            <InfoItem label="Requested By Role" value={requestData.createdByRole} />
            {requestData.zendeskTicketId && (
              <InfoItem label="Zendesk Ticket ID">
                <Link
                  href={`https://somecompany.zendesk.com/agent/tickets/${requestData.zendeskTicketId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  >
                  {requestData.zendeskTicketId}
                </Link>
              </InfoItem>
            )}
          </InfoCard>

          {!isClientView && (
            <InfoCard title="Original Payment Details">
              <InfoItem label="Order ID" value={requestData.orderId} />
              <InfoItem label="Original Item/Service" value={requestData.originalItemPaidFor} />
              <InfoItem label="Payment Method">
                <span className="ml-2">{requestData.paymentMethod ? requestData.paymentMethod.replace(/_/g, ' ') : 'N/A'}</span>
              </InfoItem>
              <InfoItem label="Card Used (Partial)" value={requestData.originalCardUsed} />
              <InfoItem label="Payment Date" value={requestData.originalPaymentDate ? new Date(requestData.originalPaymentDate).toLocaleDateString() : 'N/A'} />
              <InfoItem 
                label="Original Amount" 
                value={<span className="font-bold text-md">{`${requestData.currencySymbol}${requestData.originalOrderAmount?.toFixed(2)} ${requestData.currency}`}</span>} 
              />
              <InfoItem label="First Name" value={requestData.originalClientFirstName}>
                {isClientFirstNameMismatch && (
                  <Tooltip text="First name differs from refund request name">
                    <AlertTriangle size={16} className="ml-2 text-orange-500" />
                  </Tooltip>
                )}
              </InfoItem>
              <InfoItem label="Last Name" value={requestData.originalClientLastName}>
                {isClientLastNameMismatch && (
                  <Tooltip text="Last name differs from refund request name">
                    <AlertTriangle size={16} className="ml-2 text-orange-500" />
                  </Tooltip>
                )}
              </InfoItem>
              <InfoItem label="Billing Address" value={requestData.originalClientAddress}>
                {isClientAddressMismatch && (
                  <Tooltip text="Address differs from refund recipient address">
                    <InfoIcon size={16} className="ml-2 text-blue-500" />
                  </Tooltip>
                )}
              </InfoItem>
              {requestData.paymentProviderTransactionId && <InfoItem label="Payment Provider Txn ID" value={requestData.paymentProviderTransactionId} />}
            </InfoCard>
          )}

          {(requestData.iban || requestData.bic || requestData.bankName) && (
            <InfoCard title="Bank Details for Refund">
              {requestData.iban && <InfoItem label="IBAN" value={requestData.iban} />}
              {requestData.bic && <InfoItem label="BIC/SWIFT" value={requestData.bic} />}
              {requestData.bankName && <InfoItem label="Bank Name" value={requestData.bankName} />}
              {requestData.bankAddress && <InfoItem label="Bank Address" value={requestData.bankAddress} />}
            </InfoCard>
          )}
          
          {hasAnyNotes && (
            <InfoCard title="Notes & Communications Log">
              {hasAgentNotes && (
                <NoteDisplayItem title="Agent Notes" notes={requestData.agentNotes} />
              )}
              {hasClientValidationDetails && (
                <NoteDisplayItem title="Client Validation/Info" notes={requestData.clientValidationDetails} />
              )}
              {hasLeadComments && (
                <NoteDisplayItem title="Lead Comments" notes={requestData.leadComments} />
              )}
              {hasSupervisorNotes && (
                <NoteDisplayItem title="Supervisor Notes" notes={requestData.supervisorNotes} />
              )}
              {hasFinanceNotes && (
                <NoteDisplayItem title="Finance Notes" notes={requestData.financeNotes} />
              )}
              {hasRejectionReason && (
                <NoteDisplayItem title="Rejection Reason" notes={requestData.rejectionReason} />
              )}
            </InfoCard>
          )}

          {!isClientView && (
            <InfoCard title="Internal System Notes (Confidential)">
                <InfoItem label="Current Internal Notes" value={requestData.internalNotes || '(No internal notes yet)'} />
                <UpdateInternalNotesForm 
                    refundRequestId={requestData.id} 
                    currentNotes={requestData.internalNotes} 
                    actorName={actorName} 
                />
            </InfoCard>
          )}
        </div>

        <aside className="md:col-span-1 space-y-6">
          {!isClientView ? (
            availableActions.length > 0 ? (
              <ActionsPanel
                availableActions={availableActions}
                refundRequest={requestData}
                actorName={actorName}
                currentNotes={{
                  agentNotes: requestData.agentNotes,
                  leadComments: requestData.leadComments,
                  supervisorNotes: requestData.supervisorNotes,
                  financeNotes: requestData.financeNotes,
                  rejectionReason: requestData.rejectionReason,
                  adminNotes: requestData.internalNotes
                }}
              />
            ) : (
              <InfoCard title="Actions">
                <p className="text-sm text-slate-500">No actions available for this request in its current state or for your role.</p>
              </InfoCard>
            )
          ) : null}
          
          {!isClientView && (
            <InfoCard title="Request Journey" titleBadge={auditLogToDisplay.length > 0 ? <Badge variant="outline">{auditLogToDisplay.length} entries</Badge> : null}>
              {auditLogToDisplay.length > 0 ? (
                <ol className="relative border-s border-gray-200">
                  {auditLogToDisplay.map((entry, index) => (
                    <JourneyItem key={entry.id || index} entry={entry} isLast={index === auditLogToDisplay.length -1} />
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">No history recorded for this request yet.</p>
              )}
            </InfoCard>
          )}
        </aside>
      </div>
    </div>
  );
} 