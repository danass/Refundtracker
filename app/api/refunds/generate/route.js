import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

const FIRST_NAMES = ['Sophie', 'Lucas', 'Emma', 'Hugo', 'Léa', 'Nathan', 'Camille', 'Thomas', 'Inès', 'Maxime', 'Claire', 'Romain', 'Julie', 'Antoine', 'Sarah', 'Pierre', 'Marie', 'Julien', 'Alice', 'Nicolas'];
const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'];
const REASONS = [
  'Produit défectueux à la réception',
  'Article non conforme à la description',
  'Double facturation constatée',
  'Commande annulée avant expédition',
  'Abonnement résilié en cours de période',
  'Remboursement suite à geste commercial',
  'Erreur de montant sur la transaction',
  'Service non rendu dans les délais prévus',
  'Retour produit accepté par le service client',
  'Erreur de destinataire lors du paiement',
  'Frais débités par erreur',
  'Résiliation anticipée de contrat',
];
const CURRENCIES = ['EUR', 'EUR', 'EUR', 'USD', 'GBP'];
const PAYMENT_METHODS = ['BANK_TRANSFER', 'CREDIT_CARD', 'PAYPAL', 'WISE'];
const ITEMS = [
  'Abonnement annuel Premium',
  'Achat unique — Licence logicielle',
  'Commande marketplace #',
  'Frais de service mensuel',
  'Formation en ligne — accès 6 mois',
  'Pack professionnel — renouvellement',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount() {
  const ranges = [[15, 80], [80, 300], [300, 1200], [1200, 5000]];
  const weights = [0.4, 0.35, 0.2, 0.05];
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < weights.length; i++) {
    cum += weights[i];
    if (r < cum) {
      const [min, max] = ranges[i];
      return Math.round((Math.random() * (max - min) + min) * 100) / 100;
    }
  }
  return 99.00;
}


function pickStatus() {
  return RefundStatus.PENDING_AGENT_REVIEW;
}

function shouldFlag(amount, firstName, lastName, originalFirstName, originalLastName) {
  if (amount > 2000) return true;
  if (firstName !== originalFirstName || lastName !== originalLastName) return true;
  if (Math.random() < 0.05) return true;
  return false;
}

export async function POST() {
  try {
    // Generated refunds are always for Alice Wonder (the demo client)
    const firstName = 'Alice';
    const lastName = 'Wonder';
    const currency = pick(CURRENCIES);
    const amount = randomAmount();
    // Occasionally the original amount differs (partial refund or overbilling)
    const originalVariant = Math.random();
    const originalOrderAmount = originalVariant < 0.6
      ? amount
      : originalVariant < 0.8
      ? Math.round(amount * (1 + Math.random() * 0.3) * 100) / 100
      : Math.round(amount * (0.7 + Math.random() * 0.25) * 100) / 100;

    // Occasionally name differs from original (mismatch flag trigger)
    const nameMismatch = Math.random() < 0.12;
    const originalFirstName = nameMismatch ? pick(FIRST_NAMES) : firstName;
    const originalLastName = nameMismatch ? pick(LAST_NAMES) : lastName;

    const status = pickStatus();
    const isFlagged = shouldFlag(amount, firstName, lastName, originalFirstName, originalLastName);
    const riskTriggers = isFlagged
      ? [
          amount > 2000 ? 'Montant élevé (>' + amount.toFixed(0) + ' ' + currency + ')' : null,
          (firstName !== originalFirstName || lastName !== originalLastName) ? 'Nom bénéficiaire différent du paiement d\'origine' : null,
          isFlagged && !amount > 2000 && !(firstName !== originalFirstName) ? 'Signalement automatique aléatoire' : null,
        ].filter(Boolean).join(', ')
      : null;

    const ticketNum = Math.floor(Math.random() * 90000) + 10000;
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

    const now = new Date();
    const createdDaysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - createdDaysAgo * 86400000);

    const refund = await prisma.refundRequest.create({
      data: {
        ticketId: `TK-${ticketNum}`,
        zendeskTicketId: Math.random() < 0.6 ? `ZD-${ticketNum}` : null,
        clientFirstName: 'Alice',
        clientLastName: 'Wonder',
        clientEmail: 'alice.wonder@example.com',
        clientAddress: `${Math.floor(Math.random() * 200) + 1} Rue de la Paix, ${Math.floor(Math.random() * 90000) + 10000} Paris`,
        amount,
        originalOrderAmount,
        currency,
        reason: pick(REASONS),
        iban: null,
        bic: null,
        bankName: null,
        bankAddress: null,
        paymentMethod: pick(PAYMENT_METHODS),
        paymentProviderTransactionId: `PAY-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        status,
        createdByRole: 'agent',
        orderId,
        originalItemPaidFor: pick(ITEMS) + (Math.random() < 0.5 ? Math.floor(Math.random() * 99999) : ''),
        originalCardUsed: `Visa **** ${Math.floor(Math.random() * 9000) + 1000}`,
        originalPaymentDate: new Date(createdAt.getTime() - Math.floor(Math.random() * 60) * 86400000),
        originalClientFirstName: originalFirstName,
        originalClientLastName: originalLastName,
        originalClientAddress: `${Math.floor(Math.random() * 200) + 1} Avenue Montaigne, ${Math.floor(Math.random() * 90000) + 10000} Paris`,
        isFlagged,
        riskTriggers,
        createdAt,
        paidAt: status === RefundStatus.PAID ? new Date() : null,
        agentNotes: null,
        leadComments: null,
        supervisorNotes: null,
        financeNotes: null,
      },
    });

    // Create audit log entries to reflect the pipeline history
    const auditEntries = buildAuditTrail(refund.id, status, createdAt);
    if (auditEntries.length > 0) {
      await prisma.auditLog.createMany({ data: auditEntries });
    }

    return NextResponse.json({ success: true, refund }, { status: 201 });
  } catch (error) {
    console.error('Error generating refund:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function buildAuditTrail(refundId, finalStatus, createdAt) {
  const pipeline = [
    RefundStatus.PENDING_AGENT_REVIEW,
    RefundStatus.PENDING_LEAD_APPROVAL,
    RefundStatus.PENDING_FINAL_APPROVAL,
    RefundStatus.APPROVED_FOR_PAYMENT,
    RefundStatus.PAYMENT_PROCESSING,
    RefundStatus.PAID,
  ];

  const actors = {
    [RefundStatus.PENDING_AGENT_REVIEW]: { name: 'Agent (simulation)', role: 'agent' },
    [RefundStatus.PENDING_LEAD_APPROVAL]: { name: 'Agent (simulation)', role: 'agent' },
    [RefundStatus.PENDING_FINAL_APPROVAL]: { name: 'Responsable (simulation)', role: 'team_lead' },
    [RefundStatus.APPROVED_FOR_PAYMENT]: { name: 'Superviseur (simulation)', role: 'supervisor' },
    [RefundStatus.PAYMENT_PROCESSING]: { name: 'Finance (simulation)', role: 'finance' },
    [RefundStatus.PAID]: { name: 'Finance (simulation)', role: 'finance' },
  };

  const finalIdx = pipeline.indexOf(finalStatus);
  if (finalIdx < 0) {
    return [{
      refundRequestId: refundId,
      actorName: 'Agent (simulation)',
      actorRole: 'agent',
      actionDescription: 'Demande créée',
      previousStatus: null,
      newStatus: finalStatus,
      timestamp: createdAt,
      fieldChanges: 'Demande initialisée automatiquement',
    }];
  }

  const entries = [];
  let t = new Date(createdAt.getTime());
  for (let i = 0; i <= finalIdx; i++) {
    t = new Date(t.getTime() + Math.floor(Math.random() * 3 + 1) * 3600000);
    const actor = actors[pipeline[i]] || { name: 'Système', role: 'agent' };
    entries.push({
      refundRequestId: refundId,
      actorName: actor.name,
      actorRole: actor.role,
      actionDescription: i === 0 ? 'Demande créée' : 'Statut mis à jour',
      previousStatus: i === 0 ? null : pipeline[i - 1],
      newStatus: pipeline[i],
      timestamp: t,
      fieldChanges: null,
    });
  }
  return entries;
}
