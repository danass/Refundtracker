import { RefundStatus } from '@prisma/client';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, Clock, AlertCircle, Building2, ShieldCheck, Banknote, PartyPopper } from 'lucide-react';
import ClientProvideIbanForm from '@/components/refund-actions/ClientProvideIbanForm';

// ── Client-facing status mapping ────────────────────────────────────────

function getClientStep(status, hasIban) {
  if (status === RefundStatus.PAID) return 4;
  if ([RefundStatus.APPROVED_FOR_PAYMENT, RefundStatus.PAYMENT_PROCESSING].includes(status)) return 3;
  if ([RefundStatus.PENDING_LEAD_APPROVAL, RefundStatus.PENDING_FINAL_APPROVAL].includes(status)) return 2;
  if (!hasIban && [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS].includes(status)) return 1; // needs IBAN
  if ([RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS, RefundStatus.CLIENT_VALIDATED].includes(status)) return 2;
  if ([RefundStatus.AWAITING_CLIENT_VALIDATION, RefundStatus.RETURNED_TO_CLIENT_FOR_INFO].includes(status)) return 1;
  if (status?.includes('REJECT') || status?.includes('CANCEL')) return -1;
  return 1;
}

const STEPS = [
  { id: 1, label: 'Vos informations', desc: 'Coordonnées bancaires' },
  { id: 2, label: 'Vérification', desc: 'Examen par notre équipe' },
  { id: 3, label: 'Virement', desc: 'Traitement du paiement' },
  { id: 4, label: 'Remboursé', desc: 'Virement effectué' },
];

function clientHeadline(status, hasIban) {
  if (status === RefundStatus.PAID)
    return { title: 'Votre remboursement a été effectué', sub: 'Le virement a été envoyé sur votre compte bancaire.', tone: 'success' };
  if ([RefundStatus.APPROVED_FOR_PAYMENT, RefundStatus.PAYMENT_PROCESSING].includes(status))
    return { title: 'Votre remboursement est en cours', sub: 'Le virement est en cours d\'exécution. Délai estimé : 1–3 jours ouvrés.', tone: 'good' };
  if ([RefundStatus.PENDING_LEAD_APPROVAL, RefundStatus.PENDING_FINAL_APPROVAL].includes(status))
    return { title: 'Votre dossier est en cours de validation', sub: 'Notre équipe procède à un examen approfondi. Nous revenons vers vous sous 48h.', tone: 'neutral' };
  if (!hasIban && [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS].includes(status))
    return { title: 'Une action est requise de votre part', sub: 'Pour traiter votre remboursement, nous avons besoin de vos coordonnées bancaires.', tone: 'action' };
  if ([RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS, RefundStatus.CLIENT_VALIDATED].includes(status))
    return { title: 'Votre demande est entre nos mains', sub: 'Notre équipe examine votre dossier. Vous serez notifié(e) à chaque étape.', tone: 'neutral' };
  if ([RefundStatus.AWAITING_CLIENT_VALIDATION, RefundStatus.RETURNED_TO_CLIENT_FOR_INFO].includes(status))
    return { title: 'Nous avons besoin de votre réponse', sub: 'Merci de compléter les informations demandées pour que nous puissions traiter votre remboursement.', tone: 'action' };
  if (status?.includes('REJECT'))
    return { title: 'Votre demande n\'a pas pu être traitée', sub: 'Nous sommes désolés. Vous pouvez contacter notre service client pour plus d\'informations.', tone: 'closed' };
  if (status?.includes('CANCEL'))
    return { title: 'Demande annulée', sub: 'Cette demande a été annulée.', tone: 'closed' };
  return { title: 'Votre demande est en cours de traitement', sub: '', tone: 'neutral' };
}

const TONE_STYLES = {
  action: { bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-900', sub: 'text-amber-700', icon: AlertCircle, iconColor: 'text-amber-500' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-900', sub: 'text-emerald-700', icon: PartyPopper, iconColor: 'text-emerald-500' },
  good:    { bg: 'bg-blue-50',    border: 'border-blue-200',    title: 'text-blue-900',    sub: 'text-blue-700',    icon: Banknote,    iconColor: 'text-blue-500' },
  neutral: { bg: 'bg-white',      border: 'border-gray-200',    title: 'text-gray-900',    sub: 'text-gray-500',    icon: ShieldCheck, iconColor: 'text-blue-400' },
  closed:  { bg: 'bg-gray-50',    border: 'border-gray-200',    title: 'text-gray-600',    sub: 'text-gray-400',    icon: Circle,      iconColor: 'text-gray-300' },
};

// ── Component ────────────────────────────────────────────────────────────

export default function ClientRefundView({ r }) {
  const sym = r.currency === 'EUR' ? '€' : r.currency === 'USD' ? '$' : r.currency === 'GBP' ? '£' : r.currency;
  const hasIban = !!r.iban;
  const currentStep = getClientStep(r.status, hasIban);
  const { title, sub, tone } = clientHeadline(r.status, hasIban);
  const ts = TONE_STYLES[tone];
  const ToneIcon = ts.icon;
  const isPaid = r.status === RefundStatus.PAID;
  const isClosed = tone === 'closed';
  const needsIban = !hasIban && [RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS].includes(r.status);
  const needsClientAction = [RefundStatus.AWAITING_CLIENT_VALIDATION, RefundStatus.RETURNED_TO_CLIENT_FOR_INFO].includes(r.status);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(220,20%,97%)' }}>
      {/* Slim top nav */}
      <div className="bg-white border-b px-5 py-3 flex items-center gap-3" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        <Link href="/client" className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Mes remboursements
        </Link>
        <span className="text-gray-200">/</span>
        <span className="text-sm text-gray-500">{r.ticketId || r.id.slice(0, 8)}</span>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-5">

        {/* Amount hero */}
        <div className="text-center pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Remboursement demandé</p>
          <p className={`text-4xl font-bold ${isPaid ? 'text-emerald-600' : 'text-gray-900'}`}>
            {sym}{r.amount?.toFixed(2)}
            <span className="text-lg font-normal text-gray-400 ml-1">{r.currency}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{r.reason}</p>
        </div>

        {/* Status card */}
        <div className={`rounded-2xl border p-5 ${ts.bg} ${ts.border}`}>
          <div className="flex items-start gap-3">
            <ToneIcon className={`w-5 h-5 mt-0.5 shrink-0 ${ts.iconColor}`} />
            <div>
              <p className={`font-semibold text-base ${ts.title}`}>{title}</p>
              <p className={`text-sm mt-1 ${ts.sub}`}>{sub}</p>
            </div>
          </div>
        </div>

        {/* Progress stepper */}
        {!isClosed && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Étapes</p>
            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const done = currentStep > step.id || (currentStep === 4 && step.id === 4);
                const active = currentStep === step.id;
                const future = currentStep < step.id;
                return (
                  <div key={step.id} className="flex gap-3">
                    {/* connector column */}
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        done ? 'bg-emerald-500' : active ? 'bg-blue-600' : 'bg-gray-100'
                      }`}>
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-white" />
                          : active
                          ? <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          : <div className="w-2 h-2 rounded-full bg-gray-300" />
                        }
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 mb-1 ${done ? 'bg-emerald-200' : 'bg-gray-100'}`} />
                      )}
                    </div>
                    {/* text */}
                    <div className="pt-1 pb-4">
                      <p className={`text-sm font-semibold leading-none ${done ? 'text-emerald-700' : active ? 'text-gray-900' : 'text-gray-300'}`}>
                        {step.label}
                        {active && <span className="ml-2 text-xs font-normal text-blue-500">En cours…</span>}
                      </p>
                      <p className={`text-xs mt-0.5 ${done ? 'text-emerald-500' : active ? 'text-gray-400' : 'text-gray-300'}`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* IBAN form — proactive */}
        {needsIban && (
          <div className="bg-white rounded-2xl border-2 border-amber-200 overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-bold text-gray-900">Ajoutez vos coordonnées bancaires</p>
              </div>
              <p className="text-xs text-gray-400">Obligatoire pour recevoir votre virement. Données sécurisées et chiffrées.</p>
            </div>
            <div className="px-5 pb-5">
              <ClientProvideIbanForm requestId={r.id} inline />
            </div>
          </div>
        )}

        {/* IBAN already provided */}
        {hasIban && !isClosed && (
          <div className="bg-white rounded-2xl border p-4" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coordonnées bancaires</p>
                <p className="text-sm font-mono text-gray-700 mt-0.5">
                  {r.iban.slice(0, 4)} •••• •••• •••• {r.iban.slice(-4)}
                  {r.bankName ? ` · ${r.bankName}` : ''}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
            </div>
          </div>
        )}

        {/* Paid success card */}
        {isPaid && (
          <div className="bg-emerald-600 rounded-2xl p-6 text-center text-white">
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-bold text-lg">Remboursement effectué !</p>
            <p className="text-emerald-100 text-sm mt-1">
              {sym}{r.amount?.toFixed(2)} {r.currency} ont été virés sur votre compte.
            </p>
            {r.paidAt && (
              <p className="text-emerald-200 text-xs mt-2">
                Confirmé le {new Date(r.paidAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        )}

        {/* "What happens next" — only when waiting */}
        {!needsIban && !needsClientAction && !isPaid && !isClosed && currentStep >= 2 && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ce qui va se passer</p>
            <div className="space-y-3">
              {currentStep === 2 && <>
                <NextItem icon="🔍" text="Notre équipe vérifie les informations de votre dossier" />
                <NextItem icon="✅" text="Une fois validé, le remboursement est transmis au service financier" />
                <NextItem icon="💸" text="Le virement est exécuté sous 1–3 jours ouvrés" />
              </>}
              {currentStep === 3 && <>
                <NextItem icon="💸" text="Le virement est en cours de traitement" />
                <NextItem icon="📬" text="Vous recevrez une confirmation par email à réception" />
                <NextItem icon="⏱" text="Délai selon votre banque : 1 à 2 jours ouvrés" />
              </>}
            </div>
          </div>
        )}

        {/* Closed — rejection detail */}
        {isClosed && r.rejectionReason && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Motif</p>
            <p className="text-sm text-gray-600">{r.rejectionReason}</p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-2xl border p-5 space-y-2.5" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Récapitulatif</p>
          <SummaryRow label="Référence" value={r.ticketId || r.id.slice(0, 8)} />
          <SummaryRow label="Créée le" value={new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} />
          {r.originalItemPaidFor && <SummaryRow label="Article" value={r.originalItemPaidFor} />}
          <SummaryRow label="Moyen de paiement" value={r.originalCardUsed || r.paymentMethod?.replace(/_/g,' ')} />
        </div>

        {/* Help link */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Une question ?{' '}
          <span className="text-blue-500 cursor-pointer hover:underline">Contacter le support</span>
        </p>

      </div>
    </div>
  );
}

function NextItem({ icon, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base shrink-0">{icon}</span>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-gray-400 w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 flex-1">{value}</span>
    </div>
  );
}
