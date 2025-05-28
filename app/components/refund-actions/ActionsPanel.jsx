'use client';
import { useState } from 'react';
import ActionButton from './ActionButton';

export default function ActionsPanel({
  refundRequest,
  actorName,
  availableActions = [], // Expects an array of action configurations
  initialComment = ''
}) {
  const [comment, setComment] = useState(initialComment || '');

  if (availableActions.length === 0) {
    return <p className="text-gray-600 italic">No actions available.</p>;
  }

  // Determine if any action requires a comment to enable/disable textarea
  const isCommentRequiredByAnyAction = availableActions.some(action => action.requiresComment);
  const sharedTextareaName = availableActions.find(a => a.commentFieldName)?.commentFieldName || 'actionComment';

  return (
    <div className="bg-white shadow border border-slate-200 rounded-lg p-6 space-y-4">
      <div>
        <label htmlFor={`actionComment_${refundRequest.id}`} className="block text-sm font-semibold text-slate-700 mb-1.5">
          Notes / Reason
        </label>
        <textarea
          id={`actionComment_${refundRequest.id}`}
          name={sharedTextareaName}
          rows="4" // Increased rows for better visibility
          className="w-full p-2.5 border rounded-md shadow-sm sm:text-sm border-slate-300 bg-white text-slate-900 focus:ring-slate-500 focus:border-slate-500 placeholder-slate-400 transition-colors duration-150 focus:bg-slate-50"
          placeholder={isCommentRequiredByAnyAction ? "Please provide a reason or notes for this action..." : "Add any optional notes here..."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 mt-4">
        {availableActions.map((actionProps) => {
          // Prepare additionalFormData, ensuring targetStatus is included if present
          const additionalDataForAction = {
            ...(actionProps.additionalFormData || {}), // Include any existing additionalFormData
          };
          if (actionProps.targetStatus) {
            additionalDataForAction.targetStatus = actionProps.targetStatus;
          }

          return (
            <ActionButton
              key={actionProps.key || actionProps.buttonText} // Ensure a unique key
              refundRequestId={refundRequest.id}
              actorName={actorName}
              comment={comment} // Pass the shared comment
              commentFieldName={actionProps.commentFieldName || sharedTextareaName} // Pass the specific field name if any
              serverAction={actionProps.serverAction}
              buttonText={actionProps.buttonText}
              processingText={actionProps.processingText}
              successText={actionProps.successText}
              variant={actionProps.variant}
              buttonClassName={actionProps.buttonClassName}
              requiresComment={actionProps.requiresComment}
              additionalFormData={additionalDataForAction} // Pass the constructed additional data
            />
          );
        })}
      </div>
    </div>
  );
} 