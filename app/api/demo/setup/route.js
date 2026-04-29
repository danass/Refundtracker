import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

const ALICE = {
  firstName: 'Alice',
  lastName: 'Wonder',
  email: 'alice.wonder@example.com',
  address: '12 Rue des Lilas, 75011 Paris',
};

// Creates a clean Alice demo set: one paid (history) + one fresh pending (live).
export async function POST() {
  try {
    // Wipe Alice's previous refunds for a clean slate
    const existing = await prisma.refundRequest.findMany({
      where: { clientEmail: ALICE.email },
      select: { id: true },
    });
    if (existing.length > 0) {
      const ids = existing.map(r => r.id);
      await prisma.auditLog.deleteMany({ where: { refundRequestId: { in: ids } } });
      await prisma.refundRequest.deleteMany({ where: { id: { in: ids } } });
    }

    const now = Date.now();

    // 1. Past paid refund (60 days ago) — to populate the inbox with the success email
    const paidCreated = new Date(now - 60 * 86400000);
    const paidPaid = new Date(now - 55 * 86400000);
    const paidTicket = `TK-${Math.floor(Math.random() * 90000 + 10000)}`;
    const paid = await prisma.refundRequest.create({
      data: {
        ticketId: paidTicket,
        zendeskTicketId: `ZD-${paidTicket.slice(3)}`,
        clientFirstName: ALICE.firstName,
        clientLastName: ALICE.lastName,
        clientEmail: ALICE.email,
        clientAddress: ALICE.address,
        amount: 89.50,
        originalOrderAmount: 89.50,
        currency: 'EUR',
        reason: 'Article endommagé à la livraison',
        iban: 'FR7630006000011234567890188',
        bic: 'BNPAFRPPXXX',
        bankName: 'BNP Paribas',
        bankAddress: '16 Bd des Italiens, 75009 Paris',
        paymentMethod: 'BANK_TRANSFER',
        paymentProviderTransactionId: `PAY-${now}-A1`,
        status: RefundStatus.PAID,
        createdByRole: 'client',
        orderId: `ORD-${now}-A1`,
        originalItemPaidFor: 'Enceinte Bluetooth WaveBox',
        originalCardUsed: 'Visa **** 4242',
        originalPaymentDate: new Date(paidCreated.getTime() - 10 * 86400000),
        originalClientFirstName: ALICE.firstName,
        originalClientLastName: ALICE.lastName,
        originalClientAddress: ALICE.address,
        isFlagged: false,
        createdAt: paidCreated,
        paidAt: paidPaid,
      },
    });

    // 2. Fresh pending refund — the live one for the demo
    const ticketNum = Math.floor(Math.random() * 90000 + 10000);
    const pending = await prisma.refundRequest.create({
      data: {
        ticketId: `TK-${ticketNum}`,
        zendeskTicketId: `ZD-${ticketNum}`,
        clientFirstName: ALICE.firstName,
        clientLastName: ALICE.lastName,
        clientEmail: ALICE.email,
        clientAddress: ALICE.address,
        amount: 159.99,
        originalOrderAmount: 159.99,
        currency: 'EUR',
        reason: 'Casque audio défectueux à la réception',
        iban: null,
        bic: null,
        bankName: null,
        bankAddress: null,
        paymentMethod: 'CREDIT_CARD',
        paymentProviderTransactionId: `PAY-${now}-A2`,
        status: RefundStatus.PENDING_AGENT_REVIEW,
        createdByRole: 'agent',
        orderId: 'CMD-2026-04893',
        originalItemPaidFor: 'Casque Audio Premium ProSound X3',
        originalCardUsed: 'Visa **** 4242',
        originalPaymentDate: new Date(now - 35 * 86400000),
        originalClientFirstName: ALICE.firstName,
        originalClientLastName: ALICE.lastName,
        originalClientAddress: ALICE.address,
        isFlagged: false,
        createdAt: new Date(now - 30 * 60000), // 30 min ago
      },
    });

    // Audit logs
    await prisma.auditLog.createMany({
      data: [
        // Paid refund history
        { refundRequestId: paid.id, actorRole: 'agent', actorName: 'Marc Lefèvre', actionDescription: 'Demande créée', previousStatus: null, newStatus: RefundStatus.PENDING_AGENT_REVIEW, timestamp: paidCreated },
        { refundRequestId: paid.id, actorRole: 'client', actorName: 'Alice Wonder', actionDescription: 'IBAN fourni', previousStatus: RefundStatus.PENDING_AGENT_REVIEW, newStatus: RefundStatus.CLIENT_VALIDATED, timestamp: new Date(paidCreated.getTime() + 4 * 3600000) },
        { refundRequestId: paid.id, actorRole: 'agent', actorName: 'Marc Lefèvre', actionDescription: 'Approuvé', previousStatus: RefundStatus.CLIENT_VALIDATED, newStatus: RefundStatus.APPROVED_FOR_PAYMENT, timestamp: new Date(paidCreated.getTime() + 26 * 3600000) },
        { refundRequestId: paid.id, actorRole: 'finance', actorName: 'Isabelle Roux', actionDescription: 'Virement initié (Stripe SEPA)', previousStatus: RefundStatus.APPROVED_FOR_PAYMENT, newStatus: RefundStatus.PAYMENT_PROCESSING, timestamp: new Date(paidPaid.getTime() - 86400000) },
        { refundRequestId: paid.id, actorRole: 'finance', actorName: 'Isabelle Roux', actionDescription: 'Paiement confirmé', previousStatus: RefundStatus.PAYMENT_PROCESSING, newStatus: RefundStatus.PAID, timestamp: paidPaid },
        // Pending refund
        { refundRequestId: pending.id, actorRole: 'agent', actorName: 'Marc Lefèvre', actionDescription: 'Demande créée depuis Zendesk', previousStatus: null, newStatus: RefundStatus.PENDING_AGENT_REVIEW, timestamp: pending.createdAt },
      ],
    });

    return NextResponse.json({ success: true, pendingId: pending.id, paidId: paid.id });
  } catch (error) {
    console.error('Demo setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
