import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import MailClient from './MailClient';

const SIMULATED_CLIENT_EMAIL = 'alice.wonder@example.com';

function buildEmails(refunds) {
  const sym = (c) => c === 'EUR' ? '€' : c === 'USD' ? '$' : c === 'GBP' ? '£' : c;

  const emails = [];

  for (const r of refunds) {
    const s = sym(r.currency);
    const amount = `${s}${r.amount?.toFixed(2)}`;
    const ticket = r.ticketId || r.id.slice(0, 8).toUpperCase();
    const created = new Date(r.createdAt);
    const name = 'Alice Wonder';

    // 1. Always: confirmation
    emails.push({
      id: `${r.id}-created`,
      refundId: r.id,
      from: 'Support Clear <support@clear.io>',
      fromShort: 'Support Clear',
      fromInitials: 'CL',
      fromColor: 'bg-blue-100 text-blue-600',
      subject: `Demande reçue — ${ticket}`,
      preview: `Nous avons bien enregistré votre demande de remboursement de ${amount}.`,
      body: `Bonjour ${name},\n\nNous avons bien reçu votre demande de remboursement de ${amount} concernant : ${r.reason || 'votre commande'}.\n\nRéférence ticket : ${ticket}\n\nVotre dossier va être pris en charge par notre équipe support dans les plus brefs délais. Vous serez notifié(e) à chaque étape du traitement.\n\nCordialement,\nL'équipe Support — Clear`,
      date: created,
      read: true,
      tag: 'info',
    });

    // For demo richness, surface the full email cycle for every Alice refund.
    // The email's "live state" (read / tag) reflects the actual refund status
    // so the inbox tells a coherent story regardless of where the refund is.
    const isPaid = r.status === RefundStatus.PAID;
    const isApproved = [RefundStatus.APPROVED_FOR_PAYMENT, RefundStatus.PAYMENT_PROCESSING, RefundStatus.PAID].includes(r.status);
    const inReview = [RefundStatus.PENDING_LEAD_APPROVAL, RefundStatus.PENDING_FINAL_APPROVAL, RefundStatus.APPROVED_FOR_PAYMENT, RefundStatus.PAYMENT_PROCESSING, RefundStatus.PAID].includes(r.status);
    const ibanProvided = !!r.iban;

    // 2. IBAN request — always shown for demo
    emails.push({
      id: `${r.id}-iban`,
      refundId: r.id,
      from: 'Marc Lefèvre <marc.lefevre@clear.io>',
      fromShort: 'Marc Lefèvre',
      fromInitials: 'ML',
      fromColor: 'bg-sky-100 text-sky-700',
      subject: `[${ticket}] Coordonnées bancaires requises`,
      preview: `Pour procéder au remboursement de ${amount}, nous avons besoin de votre IBAN.`,
      body: `Bonjour ${name},\n\nJ'ai bien pris en charge votre demande de remboursement de ${amount} (réf. ${ticket}).\n\nAfin de pouvoir effectuer le virement, pourriez-vous nous communiquer vos coordonnées bancaires :\n\n  • IBAN\n  • BIC / SWIFT\n  • Nom de votre banque\n\nVous pouvez les renseigner directement depuis votre espace client en cliquant sur le lien ci-dessous.\n\nJe reste disponible pour toute question.\n\nCordialement,\nMarc Lefèvre\nAgent Support — Clear`,
      date: new Date(created.getTime() + 2 * 3600000),
      read: ibanProvided,
      tag: ibanProvided ? 'done' : 'action',
    });

    // 3. Validation in progress — shown once IBAN is in
    if (inReview || ibanProvided) {
      emails.push({
        id: `${r.id}-review`,
        refundId: r.id,
        from: 'Support Clear <support@clear.io>',
        fromShort: 'Support Clear',
        fromInitials: 'CL',
        fromColor: 'bg-blue-100 text-blue-600',
        subject: `[${ticket}] Votre dossier est en cours de validation`,
        preview: `Votre dossier a été transmis à notre équipe de validation. Délai estimé : 48h.`,
        body: `Bonjour ${name},\n\nVotre demande de remboursement de ${amount} (réf. ${ticket}) a bien été enregistrée et est en cours d'examen approfondi par notre équipe de validation interne.\n\nCe processus prend généralement 24 à 48 heures ouvrées. Vous serez notifié(e) par email dès qu'une décision sera prise.\n\nMerci de votre patience.\n\nCordialement,\nL'équipe Support — Clear`,
        date: new Date(created.getTime() + 5 * 3600000),
        read: inReview,
        tag: 'info',
      });
    }

    // 4. Approved — shown once approved or paid
    if (isApproved) {
      emails.push({
        id: `${r.id}-approved`,
        refundId: r.id,
        from: 'Paiements Clear <paiements@clear.io>',
        fromShort: 'Paiements Clear',
        fromInitials: 'PC',
        fromColor: 'bg-emerald-100 text-emerald-700',
        subject: `Bonne nouvelle ! Remboursement de ${amount} approuvé`,
        preview: `Votre demande a été approuvée. Le virement va être initié sous 24–48h.`,
        body: `Bonjour ${name},\n\nNous avons le plaisir de vous informer que votre demande de remboursement de ${amount} (réf. ${ticket}) a été approuvée par notre équipe.\n\nLe virement bancaire va être initié dans les prochaines 24 à 48 heures ouvrées sur le compte bancaire que vous nous avez communiqué.\n\nVous recevrez un email de confirmation dès que le paiement aura été effectué.\n\nCordialement,\nL'équipe Finance — Clear`,
        date: new Date(created.getTime() + 8 * 3600000),
        read: isPaid,
        tag: 'good',
      });
    }

    // 5. Paid — confirmation
    if (isPaid) {
      emails.push({
        id: `${r.id}-paid`,
        refundId: r.id,
        from: 'Paiements Clear <paiements@clear.io>',
        fromShort: 'Paiements Clear',
        fromInitials: 'PC',
        fromColor: 'bg-emerald-100 text-emerald-700',
        subject: `✓ Virement de ${amount} effectué`,
        preview: `Le remboursement de ${amount} a été envoyé sur votre compte. Délai de réception : 1–2 jours.`,
        body: `Bonjour ${name},\n\nNous vous confirmons que le virement de ${amount} a bien été effectué sur votre compte bancaire enregistré.\n\nRéférence : ${ticket}-PAY\nMontant : ${amount}\nDélai de réception : 1 à 2 jours ouvrés selon votre établissement bancaire.\n\nNous vous remercions de votre confiance et restons à votre disposition pour toute question future.\n\nCordialement,\nL'équipe Finance — Clear`,
        date: r.paidAt ? new Date(r.paidAt) : new Date(created.getTime() + 24 * 3600000),
        read: false,
        tag: 'done',
      });
    }

    // 6. Rejected
    if (r.status?.includes('REJECT') || r.status?.includes('CANCEL')) {
      emails.push({
        id: `${r.id}-rejected`,
        refundId: r.id,
        from: 'Support Clear <support@clear.io>',
        fromShort: 'Support Clear',
        fromInitials: 'CL',
        fromColor: 'bg-blue-100 text-blue-600',
        subject: `[${ticket}] Décision concernant votre demande`,
        preview: `Après examen, nous ne sommes pas en mesure de donner suite à votre demande.`,
        body: `Bonjour ${name},\n\nAprès examen attentif de votre dossier (réf. ${ticket}), nous sommes au regret de vous informer que nous ne sommes pas en mesure de donner suite à votre demande de remboursement de ${amount}.\n\n${r.rejectionReason ? `Motif : ${r.rejectionReason}\n\n` : ''}Si vous estimez que cette décision est incorrecte ou souhaitez obtenir des précisions, n'hésitez pas à nous recontacter.\n\nCordialement,\nL'équipe Support — Clear`,
        date: new Date(created.getTime() + 6 * 3600000),
        read: false,
        tag: 'closed',
      });
    }
  }

  return emails.sort((a, b) => b.date - a.date);
}

export default async function MailPage() {
  const refunds = await prisma.refundRequest.findMany({
    where: { clientEmail: SIMULATED_CLIENT_EMAIL },
    orderBy: { createdAt: 'desc' },
  });

  const emails = buildEmails(refunds);

  return <MailClient emails={emails} />;
}
