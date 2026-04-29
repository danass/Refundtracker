import { prisma } from '@/lib/prisma.js';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { RefundStatus } from '@prisma/client';
import { ArrowRight, CheckCircle2, Clock, AlertCircle, Inbox } from 'lucide-react';

const FALLBACK_CLIENT_EMAIL = 'alice.wonder@example.com';

async function getDemoUser() {
  try {
    const c = await cookies();
    const raw = c.get('demo_user')?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

async function getClientEmail() {
  const u = await getDemoUser();
  return u?.email || FALLBACK_CLIENT_EMAIL;
}

async function getClientFirstName() {
  const u = await getDemoUser();
  return u?.name?.split(' ')[0] || 'Alice';
}

function clientStatus(status, hasIban) {
  if (!hasIban && [
    RefundStatus.PENDING_AGENT_REVIEW,
    RefundStatus.RETURNED_TO_AGENT_FOR_EDITS,
  ].includes(status)) {
    return { label: 'Action requise', sub: 'Vos coordonnées bancaires sont attendues', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', urgent: true };
  }
  if ([RefundStatus.PENDING_AGENT_REVIEW, RefundStatus.RETURNED_TO_AGENT_FOR_EDITS, RefundStatus.CLIENT_VALIDATED].includes(status))
    return { label: 'En cours de traitement', sub: 'Votre dossier est examiné par notre équipe', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400' };
  if ([RefundStatus.AWAITING_CLIENT_VALIDATION, RefundStatus.RETURNED_TO_CLIENT_FOR_INFO].includes(status))
    return { label: 'Action requise', sub: 'Nous attendons votre réponse', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', urgent: true };
  if ([RefundStatus.PENDING_LEAD_APPROVAL, RefundStatus.PENDING_FINAL_APPROVAL].includes(status))
    return { label: 'En cours de validation', sub: 'Votre dossier est en examen approfondi', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-400' };
  if ([RefundStatus.APPROVED_FOR_PAYMENT, RefundStatus.PAYMENT_PROCESSING].includes(status))
    return { label: 'Remboursement en cours', sub: 'Le virement est en cours d\'exécution', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400' };
  if (status === RefundStatus.PAID)
    return { label: 'Remboursé', sub: 'Le virement a été effectué sur votre compte', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', done: true };
  if (status?.includes('REJECT') || status?.includes('CANCEL'))
    return { label: 'Dossier clôturé', sub: 'Votre demande n\'a pas pu être traitée', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-300' };
  return { label: 'En cours', sub: '', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-300' };
}

export default async function ClientDashboardPage() {
  const clientEmail = await getClientEmail();
  const firstName = await getClientFirstName();
  let requests = [];

  try {
    requests = await prisma.refundRequest.findMany({
      where: { clientEmail },
      orderBy: { createdAt: 'desc' },
    });
  } catch (e) {
    console.error(e);
  }

  const active = requests.filter(r => r.status !== RefundStatus.PAID && !r.status?.includes('REJECT') && !r.status?.includes('CANCEL'));
  const done = requests.filter(r => r.status === RefundStatus.PAID || r.status?.includes('REJECT') || r.status?.includes('CANCEL'));

  const sym = (currency) => currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;

  return (
    <div className="max-w-xl mx-auto px-5 py-10">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {firstName}</h1>
        <p className="text-sm text-gray-400 mt-1">Voici le suivi de vos remboursements</p>
      </div>

      {requests.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <Inbox className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">Aucune demande en cours</p>
          <p className="text-xs text-gray-300 mt-1">Vos futures demandes apparaîtront ici</p>
        </div>
      )}

      {/* Active requests */}
      {active.length > 0 && (
        <div className="space-y-3 mb-8">
          {active.map(r => {
            const cs = clientStatus(r.status, !!r.iban);
            return (
              <Link
                key={r.id}
                href={`/refunds/${r.id}?simulatedRole=client`}
                className={`flex items-center gap-4 p-4 rounded-2xl border bg-white hover:shadow-md transition-all ${cs.urgent ? 'ring-2 ring-amber-200' : ''}`}
                style={{ borderColor: cs.urgent ? 'rgb(253,230,138)' : 'hsl(220,13%,89%)' }}
              >
                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cs.dot} ${!cs.done ? 'animate-pulse' : ''}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {sym(r.currency)}{r.amount?.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">{r.currency} · {r.ticketId}</span>
                  </div>
                  <p className={`text-sm font-medium mt-0.5 ${cs.color}`}>{cs.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{cs.sub}</p>
                </div>

                <ArrowRight className={`w-4 h-4 shrink-0 ${cs.urgent ? 'text-amber-400' : 'text-gray-300'}`} />
              </Link>
            );
          })}
        </div>
      )}

      {/* Closed requests */}
      {done.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dossiers terminés</p>
          <div className="space-y-2">
            {done.map(r => {
              const cs = clientStatus(r.status, !!r.iban);
              return (
                <Link
                  key={r.id}
                  href={`/refunds/${r.id}?simulatedRole=client`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-white hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'hsl(220,13%,89%)' }}
                >
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${r.status === RefundStatus.PAID ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700">
                      {sym(r.currency)}{r.amount?.toFixed(2)} {r.currency}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">{cs.label}</span>
                  </div>
                  <span className="text-xs text-gray-300">{new Date(r.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
