'use client';

import { clientSubmitInfo } from '@/actions/clientActions';
import GenericActionForm from './GenericActionForm';

export default function ClientSubmitInfoForm({ refundRequest, actorName }) {
  const agentRequestText = refundRequest.auditLogs
    .filter(log => log.newStatus === 'RETURNED_TO_CLIENT_FOR_INFO' && log.fieldChanges?.includes('Agent notes for client'))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.fieldChanges 
    || "The agent has requested additional information. Please provide it below.";

  return (
    <GenericActionForm
      refundRequest={refundRequest}
      actorName={actorName}
      serverAction={clientSubmitInfo}
      formTitle="Submit Requested Information"
      textareaLabel="Your Information (Required):"
      textareaName="clientProvidedInfo"
      textareaPlaceholder="Please provide the requested information here..."
      textareaRequired={true}
      submitButtonText="Submit Information"
      submitButtonProcessingText="Submitting..."
      submitButtonSuccessText="Submitted!"
      buttonClassName="bg-blue-600 hover:bg-blue-700"
      successMessage="Information submitted successfully!"
    >
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm font-medium text-yellow-700">Agent Request:</p>
        <p className="text-sm text-yellow-600 whitespace-pre-wrap">
          {agentRequestText.replace('Agent notes for client: ','')}
        </p>
      </div>
    </GenericActionForm>
  );
} 