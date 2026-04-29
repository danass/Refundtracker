import { getRefundRequestWithHistory } from '@/lib/query';
import { notFound } from 'next/navigation';
import { RefundStatus } from '@prisma/client';
import { getStatusVariant, getStatusLabel } from '@/lib/utils';
import {
  agentActionConfigurations,
  leadActionConfigurations,
  supervisorActionConfigurations,
  financeActionConfigurations,
  adminActionConfigurations,
} from '@/lib/actionConfigs.js';
import { AlertTriangle, Info, User, CreditCard, FileText, Lock, Clock, ArrowLeft, Building2, CheckCircle2, XCircle, Circle, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Tooltip from '@/components/ui/Tooltip';
import ActionsPanel from '@/components/refund-actions/ActionsPanel';
import FinancePaymentPanel from '@/components/refund-actions/FinancePaymentPanel';
import UpdateInternalNotesForm from '@/components/refund-actions/UpdateInternalNotesForm';
import ClientValidationAndEditForm from '@/components/refund-actions/ClientValidationAndEditForm';
import ClientEditDetailsForm from '@/components/refund-actions/ClientEditDetailsForm';
import ClientSubmitInfoForm from '@/components/refund-actions/ClientSubmitInfoForm';
import BackButton from '@/components/ui/BackButton';
import ClientProvideIbanForm from '@/components/refund-actions/ClientProvideIbanForm';
import ClientRefundView from '@/components/ClientRefundView';

// ── Helpers ──────────────────────────────────────────────────────────

function timelineColor(status) {
  if (!status) return '#9ca3af';
  if (status.includes('REJECT') || status.includes('CANCEL') || status.includes('ERROR')) return '#ef4444';
  if (status.includes('PAID') || status.includes('APPROVED')) return '#10b981';
  if (status.includes('RETURNED')) return '#f97316';
  if (status.includes('PENDING') || status.includes('AWAITING')) return '#f59e0b';
  return '#6b7280';
}

// ── Sub-components ────────────────────────────────────────────────────

function Section({ icon: Icon, title, children, flush = false }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      <div className={flush ? '' : 'px-5 py-4 space-y-3'}>{children}</div>
    </div>
  );
}

function Row({ label, children, warn, info }) {
  return (
    <div className="flex items-start gap-3 py-0.5">
      <dt className="w-40 shrink-0 text-xs text-gray-400 pt-0.5 leading-5">{label}</dt>
      <dd className="flex-1 text-sm text-gray-900 flex items-center gap-1.5 flex-wrap">
        {children}
        {warn && (
          <Tooltip text={warn}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </Tooltip>
        )}
        {info && (
          <Tooltip text={info}>
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          </Tooltip>
        )}
      </dd>
    </div>
  );
}

function Empty({ label = '—' }) {
  return <span className="text-gray-300">{label}</span>;
}

function CheckItem({ ok, warn, label, detail }) {
  const icon = ok
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
    : warn
    ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
    : <Circle className="w-4 h-4 text-gray-200 shrink-0 mt-0.5" />;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {icon}
      <div>
        <p className={`text-sm font-medium ${ok ? 'text-gray-700' : warn ? 'text-amber-700' : 'text-gray-400'}`}>{label}</p>
        {detail && <p className={`text-xs mt-0.5 ${ok ? 'text-gray-400' : warn ? 'text-amber-600' : 'text-gray-300'}`}>{detail}</p>}
      </div>
    </div>
  );
}

function TimelineEntry({ entry, isLast }) {
  const color = timelineColor(entry.newStatus || '');
  return (
    <li className="flex gap-3 pb-4 last:pb-0">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: color }} />
        {!isLast && <div className="w-px flex-1 mt-1" style={{ background: 'hsl(220,13%,91%)' }} />}
      </div>
      <div className="flex-1 min-w-0 pb-0.5">
        <p className="text-sm font-medium text-gray-800 leading-snug">
          {entry.newStatus ? getStatusLabel(entry.newStatus) : entry.actionDescription}
        </p>
        {entry.oldStatus && (
          <p className="text-xs text-gray-400">depuis : {getStatusLabel(entry.oldStatus)}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {entry.createdAt && !isNaN(new Date(entry.createdAt))
            ? new Date(entry.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : 'Date inconnue'}
          {entry.changedBy ? ` · ${entry.changedBy}` : ''}
        </p>
        {entry.notes && (
          <p className="mt-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            {entry.notes}
          </p>
        )}
      </div>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default async function RefundRequestDetail({ params, searchParams: searchParamsProp }) {
  const searchParams = await searchParamsProp;
  const { id } = await params;
  const simulatedRole = searchParams?.simulatedRole || 'client';

  const refundRequest = await getRefundRequestWithHistory(id);
  if (!refundRequest) notFound();

  const r = refundRequest;

  // Client gets a fully different experience
  if (simulatedRole === 'client') return <ClientRefundView r={r} />;

  const sym = r.currency === 'EUR' ? '€' : r.currency === 'USD' ? '$' : r.currency === 'GBP' ? '£' : r.currency;

  const nameMismatch = r.clientFirstName !== r.originalClientFirstName || r.clientLastName !== r.originalClientLastName;
  const addressMismatch = r.clientAddress && r.originalClientAddress && r.clientAddress !== r.originalClientAddress;
  const amountOver = r.originalOrderAmount != null && r.amount > r.originalOrderAmount;
  const amountUnder = r.originalOrderAmount != null && r.amount < r.originalOrderAmount;

  const isClient = simulatedRole === 'client';
  const isAgent = simulatedRole === 'agent';
  const isLead = simulatedRole === 'team_lead' || simulatedRole === 'lead';
  const isSupervisor = simulatedRole === 'supervisor';
  const isFinance = simulatedRole === 'finance';
  const isAdmin = simulatedRole === 'admin';
  const isInternal = !isClient;

  const actorName = isAgent ? 'Marc Lefèvre' : isLead ? 'Vanessa Durand' : isSupervisor ? 'Éric Bertrand' : isFinance ? 'Isabelle Roux' : 'Client';

  const TERMINAL = [RefundStatus.PAID, RefundStatus.REJECTED_BY_AGENT, RefundStatus.REJECTED_BY_LEAD, RefundStatus.REJECTED_BY_SUPERVISOR, RefundStatus.CANCELLED_BY_CLIENT, RefundStatus.CANCELLED_BY_AGENT];
  const isTerminal = TERMINAL.includes(r.status);

  // Show the Stripe-styled inline payment panel for finance whenever the refund
  // is in the payment lifecycle (approved, processing, or just paid). Keeping it
  // visible across these statuses avoids flickering between the trigger panel
  // and a generic action panel during the Stripe animation.
  const showFinancePaymentPanel = isFinance && (
    r.status === RefundStatus.APPROVED_FOR_PAYMENT
    || r.status === RefundStatus.PAYMENT_PROCESSING
    || r.status === RefundStatus.PAID
    || r.status === RefundStatus.ERROR_PROCESSING_PAYMENT
  );

  let availableActions = [];
  if (isInternal && !isTerminal) {
    const allConfigs = [...agentActionConfigurations, ...leadActionConfigurations, ...supervisorActionConfigurations, ...financeActionConfigurations, ...(isAdmin ? adminActionConfigurations : [])];
    availableActions = allConfigs.filter(cfg => {
      const roleMatch = (cfg.requiredRole === 'agent' && isAgent) || ((cfg.requiredRole === 'lead' || cfg.requiredRole === 'team_lead') && isLead) || (cfg.requiredRole === 'supervisor' && isSupervisor) || (cfg.requiredRole === 'finance' && isFinance) || (cfg.requiredRole === 'admin' && isAdmin);
      // When the dedicated Stripe panel is shown, hide the generic financeTriggerPayment button
      if (showFinancePaymentPanel && cfg.key === 'financeTriggerPayment') return false;
      return roleMatch && cfg.applicableStatuses.includes(r.status);
    }).map(cfg => cfg.key === 'leadApprove' ? { ...cfg, buttonText: 'Approuver → Finance' } : cfg);
  }

  const auditLog = (r.auditLogs || []).map(log => ({
    createdAt: log.timestamp,
    changedBy: log.actorName,
    newStatus: log.newStatus,
    oldStatus: log.previousStatus,
    notes: log.fieldChanges,
    actionDescription: log.actionDescription,
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const roleDashboard = { agent: '/agent', lead: '/lead', team_lead: '/lead', supervisor: '/supervisor', finance: '/finance', client: '/client' };
  const roleLabel = { agent: 'Agent', lead: 'Responsable', team_lead: 'Responsable', supervisor: 'Superviseur', finance: 'Finance', client: 'Client' };

  const hasNotes = r.agentNotes || r.leadComments || r.supervisorNotes || r.financeNotes || r.rejectionReason;

  return (
    <div className="min-h-screen" style={{ background: 'hsl(220,20%,97%)' }}>
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-4" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        <BackButton buttonText={`← ${roleLabel[simulatedRole] || 'Retour'}`} />
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {r.ticketId || r.id}
          </span>
          {r.zendeskTicketId && (
            <span className="text-xs text-gray-400">· ZD-{r.zendeskTicketId}</span>
          )}
        </div>
        <Badge variant={getStatusVariant(r.status)} className="shrink-0">
          {getStatusLabel(r.status)}
        </Badge>
        {isAgent && r.zendeskTicketId && (
          <Link
            href={`/zendesk/${r.zendeskTicketId}`}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1f73b7] text-white rounded-md text-xs font-medium hover:bg-[#1a65a3] transition-colors shrink-0"
            target="_blank"
          >
            <svg viewBox="0 0 16 16" className="w-3 h-3 fill-white"><path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/></svg>
            Zendesk
          </Link>
        )}
        {r.isFlagged && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-xs font-medium text-amber-700">Signalée</span>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Flag banner */}
          {r.isFlagged && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold mb-0.5">Demande signalée</p>
                <p className="text-amber-700 text-xs">{r.riskTriggers || 'Vérification requise.'}</p>
              </div>
            </div>
          )}

          {/* Client forms */}
          {isClient && r.status === RefundStatus.AWAITING_CLIENT_VALIDATION && (
            <ClientValidationAndEditForm refundRequest={r} actorName={actorName} />
          )}
          {isClient && r.status === RefundStatus.RETURNED_TO_CLIENT_FOR_INFO && (
            <>
              <ClientEditDetailsForm requestData={r} actorName={actorName} asStandaloneForm />
              <ClientSubmitInfoForm refundRequest={r} actorName={actorName} />
            </>
          )}
          {/* Proactive IBAN form — show whenever client views a pending request with no IBAN */}
          {isClient && !r.iban && [
            RefundStatus.PENDING_AGENT_REVIEW,
            RefundStatus.RETURNED_TO_AGENT_FOR_EDITS,
            RefundStatus.PENDING_LEAD_APPROVAL,
            RefundStatus.PENDING_FINAL_APPROVAL,
          ].includes(r.status) && (
            <ClientProvideIbanForm requestId={r.id} />
          )}

          {/* Client info */}
          <Section icon={User} title="Client">
            <Row label="Nom complet">
              <span className="font-medium">{r.clientFirstName} {r.clientLastName}</span>
              {nameMismatch && <Tooltip text="Nom différent du paiement d'origine"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></Tooltip>}
            </Row>
            <Row label="Email">{r.clientEmail || <Empty />}</Row>
            <Row label="Adresse" info={addressMismatch ? "Adresse différente de la facturation d'origine" : undefined}>
              {r.clientAddress || <Empty />}
            </Row>
          </Section>

          {/* Request */}
          <Section icon={FileText} title="Demande de remboursement">
            <Row label="Motif">
              <span className="text-gray-700">{r.reason || <Empty />}</span>
            </Row>
            <Row label="Montant demandé">
              <span className="text-lg font-bold text-gray-900">{sym}{r.amount?.toFixed(2)} {r.currency}</span>
              {amountOver && <Tooltip text={`Supérieur au paiement d'origine (${sym}${r.originalOrderAmount?.toFixed(2)})`}><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></Tooltip>}
              {amountUnder && <Tooltip text={`Inférieur au paiement d'origine (${sym}${r.originalOrderAmount?.toFixed(2)})`}><Info className="w-3.5 h-3.5 text-blue-400" /></Tooltip>}
            </Row>
            <Row label="Créée le">{new Date(r.createdAt).toLocaleString('fr-FR')}</Row>
            <Row label="Mise à jour">{new Date(r.updatedAt).toLocaleString('fr-FR')}</Row>
            {r.paidAt && <Row label="Remboursée le"><span className="text-emerald-600 font-medium">{new Date(r.paidAt).toLocaleString('fr-FR')}</span></Row>}
          </Section>

          {/* Original payment — internal only */}
          {isInternal && (
            <Section icon={CreditCard} title="Paiement d'origine">
              <Row label="Article">{r.originalItemPaidFor || <Empty />}</Row>
              <Row label="Montant initial">
                {r.originalOrderAmount != null
                  ? <span className="font-medium">{sym}{r.originalOrderAmount.toFixed(2)} {r.currency}</span>
                  : <Empty />}
              </Row>
              <Row label="Date">{r.originalPaymentDate ? new Date(r.originalPaymentDate).toLocaleDateString('fr-FR') : <Empty />}</Row>
              <Row label="Mode">{r.paymentMethod ? r.paymentMethod.replace(/_/g, ' ') : <Empty />}</Row>
              <Row label="Carte">{r.originalCardUsed || <Empty />}</Row>
              <Row label="ID transaction">{r.paymentProviderTransactionId || <Empty />}</Row>
              <Row label="N° commande">{r.orderId || <Empty />}</Row>
              <Row label="Nom facturé">
                <span>{r.originalClientFirstName} {r.originalClientLastName}</span>
                {nameMismatch && <Tooltip text="Différent du bénéficiaire"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></Tooltip>}
              </Row>
            </Section>
          )}

          {/* Bank details */}
          {(r.iban || r.bic || r.bankName) ? (
            <Section icon={Building2} title="Coordonnées bancaires">
              {r.iban && <Row label="IBAN"><span className="font-mono text-xs tracking-wide">{r.iban}</span></Row>}
              {r.bic && <Row label="BIC / SWIFT"><span className="font-mono text-xs">{r.bic}</span></Row>}
              {r.bankName && <Row label="Banque">{r.bankName}</Row>}
              {r.bankAddress && <Row label="Adresse banque">{r.bankAddress}</Row>}
            </Section>
          ) : isInternal ? (
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-dashed text-sm text-gray-400" style={{ borderColor: 'hsl(220,13%,84%)' }}>
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Coordonnées bancaires non renseignées — le client les fournira lors de la validation.</span>
            </div>
          ) : null}

          {/* Notes — internal only */}
          {isInternal && hasNotes && (
            <Section icon={FileText} title="Notes & communications">
              {r.agentNotes && (
                <div className="pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                  <p className="text-xs font-medium text-gray-400 mb-1">Agent</p>
                  <p className="text-sm text-gray-700">{r.agentNotes}</p>
                </div>
              )}
              {r.leadComments && (
                <div className="pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                  <p className="text-xs font-medium text-gray-400 mb-1">Responsable</p>
                  <p className="text-sm text-gray-700">{r.leadComments}</p>
                </div>
              )}
              {r.supervisorNotes && (
                <div className="pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                  <p className="text-xs font-medium text-gray-400 mb-1">Superviseur</p>
                  <p className="text-sm text-gray-700">{r.supervisorNotes}</p>
                </div>
              )}
              {r.financeNotes && (
                <div className="pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                  <p className="text-xs font-medium text-gray-400 mb-1">Finance</p>
                  <p className="text-sm text-gray-700">{r.financeNotes}</p>
                </div>
              )}
              {r.rejectionReason && (
                <div className="pb-0">
                  <p className="text-xs font-medium text-red-400 mb-1">Motif du rejet</p>
                  <p className="text-sm text-red-700">{r.rejectionReason}</p>
                </div>
              )}
            </Section>
          )}

          {/* Internal notes form */}
          {isInternal && (
            <Section icon={Lock} title="Notes internes (confidentielles)">
              <UpdateInternalNotesForm
                requestId={r.id}
                currentNotes={r.internalNotes}
              />
            </Section>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">

          {/* IBAN / validation checklist — agent only */}
          {isAgent && (
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(220,13%,89%)' }}>
              <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Checklist de traitement</span>
              </div>
              <div className="px-5 py-3 divide-y" style={{ borderColor: 'hsl(220,13%,91%)' }}>
                <CheckItem
                  ok={!!r.iban && !!r.bic}
                  warn={!r.iban}
                  label={r.iban ? `IBAN fourni` : 'IBAN manquant'}
                  detail={r.iban
                    ? `${r.iban.slice(0, 4)} •••• ${r.iban.slice(-4)}${r.bic ? ` · ${r.bic}` : ''}`
                    : 'À demander au client avant traitement'}
                />
                <CheckItem
                  ok={!nameMismatch}
                  warn={nameMismatch}
                  label={nameMismatch ? 'Nom bénéficiaire différent' : 'Identité cohérente'}
                  detail={nameMismatch
                    ? `Demandeur : ${r.clientFirstName} ${r.clientLastName} — Paiement original : ${r.originalClientFirstName} ${r.originalClientLastName}`
                    : `${r.clientFirstName} ${r.clientLastName}`}
                />
                <CheckItem
                  ok={!amountOver}
                  warn={amountOver}
                  label={amountOver ? 'Montant supérieur à la commande' : 'Montant cohérent'}
                  detail={r.originalOrderAmount != null
                    ? `Demandé : ${sym}${r.amount?.toFixed(2)} — Original : ${sym}${r.originalOrderAmount?.toFixed(2)}`
                    : undefined}
                />
                <CheckItem
                  ok={!r.isFlagged}
                  warn={r.isFlagged}
                  label={r.isFlagged ? 'Demande signalée' : 'Aucune anomalie détectée'}
                  detail={r.isFlagged ? r.riskTriggers : undefined}
                />
              </div>
              {/* Relance button if IBAN missing */}
              {!r.iban && (r.status === RefundStatus.PENDING_AGENT_REVIEW || r.status === RefundStatus.RETURNED_TO_AGENT_FOR_EDITS) && (
                <div className="px-5 pb-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                    <p className="text-xs text-amber-700 font-medium">
                      Le client n'a pas encore fourni son IBAN. Utilisez "Demander info au client" pour envoyer une relance.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stripe-styled inline payment panel — finance + payment lifecycle */}
          {showFinancePaymentPanel && (
            <FinancePaymentPanel
              refundRequest={r}
              actorName={actorName}
              currentStatus={r.status}
            />
          )}

          {/* Actions */}
          {isInternal && (
            <ActionsPanel
              availableActions={availableActions}
              refundRequest={r}
              actorName={actorName}
            />
          )}

          {/* Timeline */}
          {isInternal && (
            <Section icon={Clock} title={`Historique · ${auditLog.length} entrée${auditLog.length > 1 ? 's' : ''}`}>
              {auditLog.length > 0 ? (
                <ul className="px-5 py-4">
                  {auditLog.map((entry, i) => (
                    <TimelineEntry key={i} entry={entry} isLast={i === auditLog.length - 1} />
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-gray-400">Aucun historique.</p>
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
