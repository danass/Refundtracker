import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

const ALICE_EMAIL = 'alice.wonder@example.com';

// Advance Alice's live (non-paid, non-rejected) refund to a target status.
// Used by the presentation to keep a single refund travelling through the pipeline.
export async function POST(request) {
  try {
    const { target } = await request.json();
    if (!target || !RefundStatus[target]) {
      return NextResponse.json({ error: 'Invalid target status' }, { status: 400 });
    }

    // Find Alice's live refund (the one that's not the historic PAID one)
    const refund = await prisma.refundRequest.findFirst({
      where: {
        clientEmail: ALICE_EMAIL,
        status: { notIn: [RefundStatus.PAID, RefundStatus.REJECTED_BY_AGENT, RefundStatus.REJECTED_BY_LEAD, RefundStatus.REJECTED_BY_SUPERVISOR, RefundStatus.CANCELLED_BY_AGENT, RefundStatus.CANCELLED_BY_CLIENT] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!refund) {
      return NextResponse.json({ error: 'No live Alice refund — run /api/demo/setup first' }, { status: 404 });
    }

    const previous = refund.status;
    const updates = { status: target };

    // Side effects per target status
    if (target === RefundStatus.CLIENT_VALIDATED && !refund.iban) {
      updates.iban = 'FR7630006000011234567890188';
      updates.bic = 'BNPAFRPPXXX';
      updates.bankName = 'BNP Paribas';
      updates.bankAddress = '16 Bd des Italiens, 75009 Paris';
    }
    if (target === RefundStatus.PAID) {
      updates.paidAt = new Date();
    }

    await prisma.refundRequest.update({ where: { id: refund.id }, data: updates });

    // Audit log entry
    const actorByStatus = {
      [RefundStatus.CLIENT_VALIDATED]:        { role: 'client',     name: 'Alice Wonder',     desc: 'Coordonnées bancaires fournies' },
      [RefundStatus.PENDING_AGENT_REVIEW]:    { role: 'agent',      name: 'Marc Lefèvre',     desc: 'En attente de l\'agent' },
      [RefundStatus.PENDING_LEAD_APPROVAL]:   { role: 'agent',      name: 'Marc Lefèvre',     desc: 'Escaladé au responsable' },
      [RefundStatus.PENDING_FINAL_APPROVAL]:  { role: 'team_lead',  name: 'Vanessa Durand',   desc: 'Validé · transmis au superviseur' },
      [RefundStatus.APPROVED_FOR_PAYMENT]:    { role: 'supervisor', name: 'Éric Bertrand',    desc: 'Approbation finale accordée' },
      [RefundStatus.PAYMENT_PROCESSING]:      { role: 'finance',    name: 'Isabelle Roux',    desc: 'Virement initié (Stripe SEPA)' },
      [RefundStatus.PAID]:                    { role: 'finance',    name: 'Isabelle Roux',    desc: 'Paiement confirmé' },
    };
    const actor = actorByStatus[target] || { role: 'system', name: 'Système', desc: 'Statut mis à jour' };

    await prisma.auditLog.create({
      data: {
        refundRequestId: refund.id,
        actorRole: actor.role,
        actorName: actor.name,
        actionDescription: actor.desc,
        previousStatus: previous,
        newStatus: target,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: refund.id, status: target });
  } catch (e) {
    console.error('Demo advance error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET returns the live Alice refund ID (helper for client)
export async function GET() {
  const refund = await prisma.refundRequest.findFirst({
    where: { clientEmail: ALICE_EMAIL, status: { notIn: [RefundStatus.PAID] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, ticketId: true, zendeskTicketId: true },
  });
  return NextResponse.json(refund || {});
}
