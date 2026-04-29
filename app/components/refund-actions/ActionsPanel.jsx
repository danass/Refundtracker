'use client';
import { useState } from 'react';
import ActionButton from './ActionButton';

const ACTION_STYLES = {
  agentApprove:       { bg: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-white', icon: '✓' },
  agentRequestInfo:   { bg: 'bg-blue-500 hover:bg-blue-600',    text: 'text-white', icon: '?' },
  agentEscalate:      { bg: 'bg-amber-500 hover:bg-amber-600',  text: 'text-white', icon: '↑' },
  agentReject:        { bg: 'bg-red-500 hover:bg-red-600',      text: 'text-white', icon: '✕' },
  leadApprove:        { bg: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-white', icon: '✓' },
  leadReturnToAgent:  { bg: 'bg-amber-500 hover:bg-amber-600',  text: 'text-white', icon: '↩' },
  leadReject:         { bg: 'bg-red-500 hover:bg-red-600',      text: 'text-white', icon: '✕' },
  supervisorApprove:  { bg: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-white', icon: '✓' },
  supervisorReject:   { bg: 'bg-red-500 hover:bg-red-600',      text: 'text-white', icon: '✕' },
  financeTriggerPayment: { bg: 'bg-blue-500 hover:bg-blue-600', text: 'text-white', icon: '→' },
  financeReject:      { bg: 'bg-red-500 hover:bg-red-600',      text: 'text-white', icon: '✕' },
  financeHandlePaymentError: { bg: 'bg-orange-500 hover:bg-orange-600', text: 'text-white', icon: '!' },
};

export default function ActionsPanel({
  refundRequest,
  actorName,
  availableActions = [],
  initialComment = ''
}) {
  const [comment, setComment] = useState(initialComment || '');

  if (availableActions.length === 0) {
    return (
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</span>
        </div>
        <p className="px-5 py-4 text-sm text-gray-400 italic">Aucune action disponible à ce stade.</p>
      </div>
    );
  }

  const isCommentRequiredByAnyAction = availableActions.some(action => action.requiresComment);
  const sharedTextareaName = availableActions.find(a => a.commentFieldName)?.commentFieldName || 'actionComment';

  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</span>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div>
          <label
            htmlFor={`actionComment_${refundRequest.id}`}
            className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"
          >
            Notes / Motif
            {isCommentRequiredByAnyAction && <span className="text-red-400 ml-1">*</span>}
          </label>
          <textarea
            id={`actionComment_${refundRequest.id}`}
            name={sharedTextareaName}
            rows="3"
            className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-300 transition-all"
            style={{ borderColor: 'hsl(220,13%,89%)' }}
            placeholder={isCommentRequiredByAnyAction ? "Motif requis pour certaines actions…" : "Notes optionnelles…"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Visual action buttons */}
        <div className="flex flex-col gap-2">
          {availableActions.map((actionProps) => {
            const style = ACTION_STYLES[actionProps.key] || { bg: 'bg-gray-700 hover:bg-gray-800', text: 'text-white', icon: '→' };
            const additionalDataForAction = { ...(actionProps.additionalFormData || {}) };
            if (actionProps.targetStatus) additionalDataForAction.targetStatus = actionProps.targetStatus;

            return (
              <ActionButton
                key={actionProps.key || actionProps.buttonText}
                refundRequestId={refundRequest.id}
                actorName={actorName}
                comment={comment}
                commentFieldName={actionProps.commentFieldName || sharedTextareaName}
                serverAction={actionProps.serverAction}
                buttonText={actionProps.buttonText}
                processingText={actionProps.processingText}
                successText={actionProps.successText}
                requiresComment={actionProps.requiresComment}
                additionalFormData={additionalDataForAction}
                buttonClassName={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${style.bg} ${style.text}`}
                icon={style.icon}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
