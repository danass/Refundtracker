import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

const FIRST_NAMES = ['Sophie', 'Lucas', 'Emma', 'Hugo', 'Léa', 'Nathan', 'Camille', 'Thomas', 'Inès', 'Maxime', 'Claire', 'Romain', 'Julie', 'Antoine', 'Sarah', 'Pierre', 'Marie', 'Julien', 'Nicolas', 'Chloé', 'Alexis', 'Manon', 'Baptiste', 'Laura', 'Théo', 'Lucie', 'Quentin', 'Eva', 'Florian', 'Élodie'];
const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand'];
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
  'Commande marketplace',
  'Frais de service mensuel',
  'Formation en ligne — accès 6 mois',
  'Pack professionnel — renouvellement',
];
const BANKS = [
  { name: 'BNP Paribas', bic: 'BNPAFRPPXXX', address: '16 Bd des Italiens, 75009 Paris' },
  { name: 'Société Générale', bic: 'SOGEFRPPXXX', address: '29 Bd Haussmann, 75009 Paris' },
  { name: 'Crédit Agricole', bic: 'AGRIFRPPXXX', address: '12 Pl. des États-Unis, 92120 Montrouge' },
  { name: 'LCL', bic: 'CRLYFRPPXXX', address: '18 Rue de la Ville-l\'Évêque, 75008 Paris' },
  { name: 'Revolut', bic: 'REVOLT21XXX', address: '7 Westferry Circus, London E14 4HD' },
];

// Distribution for demo: enough items in each queue to be interesting
const STATUS_DISTRIBUTION = [
  [RefundStatus.PENDING_AGENT_REVIEW, 6],   // awaiting IBAN from client
  [RefundStatus.CLIENT_VALIDATED, 5],        // IBAN received, ready to process
  [RefundStatus.RETURNED_TO_AGENT_FOR_EDITS, 2],
  [RefundStatus.AWAITING_CLIENT_VALIDATION, 2],
  [RefundStatus.RETURNED_TO_CLIENT_FOR_INFO, 1],
  [RefundStatus.PENDING_LEAD_APPROVAL, 6],
  [RefundStatus.PENDING_FINAL_APPROVAL, 4],
  [RefundStatus.APPROVED_FOR_PAYMENT, 4],
  [RefundStatus.PAYMENT_PROCESSING, 2],
  [RefundStatus.PAID, 5],
  [RefundStatus.REJECTED_BY_AGENT, 2],
  [RefundStatus.REJECTED_BY_LEAD, 1],
  [RefundStatus.REJECTED_BY_SUPERVISOR, 1],
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

function randomIban(currency) {
  const prefixes = { EUR: 'FR76300060000', USD: 'US0000000000', GBP: 'GB29NWBK6016' };
  return (prefixes[currency] || prefixes.EUR) + Math.random().toString().slice(2, 14);
}

const PIPELINE = [
  RefundStatus.PENDING_AGENT_REVIEW,
  RefundStatus.PENDING_LEAD_APPROVAL,
  RefundStatus.PENDING_FINAL_APPROVAL,
  RefundStatus.APPROVED_FOR_PAYMENT,
  RefundStatus.PAYMENT_PROCESSING,
  RefundStatus.PAID,
];
const ACTOR_FOR_STATUS = {
  [RefundStatus.PENDING_AGENT_REVIEW]: { name: 'Agent (simulation)', role: 'agent' },
  [RefundStatus.PENDING_LEAD_APPROVAL]: { name: 'Agent (simulation)', role: 'agent' },
  [RefundStatus.PENDING_FINAL_APPROVAL]: { name: 'Responsable (simulation)', role: 'team_lead' },
  [RefundStatus.APPROVED_FOR_PAYMENT]: { name: 'Superviseur (simulation)', role: 'supervisor' },
  [RefundStatus.PAYMENT_PROCESSING]: { name: 'Finance (simulation)', role: 'finance' },
  [RefundStatus.PAID]: { name: 'Finance (simulation)', role: 'finance' },
};

function buildAuditTrail(refundId, finalStatus, createdAt) {
  const finalIdx = PIPELINE.indexOf(finalStatus);
  if (finalIdx < 0) {
    return [{
      refundRequestId: refundId,
      actorName: 'Agent (simulation)',
      actorRole: 'agent',
      actionDescription: 'Demande créée',
      previousStatus: null,
      newStatus: finalStatus,
      timestamp: createdAt,
      fieldChanges: null,
    }];
  }
  const entries = [];
  let t = new Date(createdAt.getTime());
  for (let i = 0; i <= finalIdx; i++) {
    t = new Date(t.getTime() + Math.floor(Math.random() * 4 + 1) * 3600000);
    const actor = ACTOR_FOR_STATUS[PIPELINE[i]] || { name: 'Système', role: 'agent' };
    entries.push({
      refundRequestId: refundId,
      actorName: actor.name,
      actorRole: actor.role,
      actionDescription: i === 0 ? 'Demande créée' : 'Statut mis à jour',
      previousStatus: i === 0 ? null : PIPELINE[i - 1],
      newStatus: PIPELINE[i],
      timestamp: t,
      fieldChanges: null,
    });
  }
  return entries;
}

function buildRefund(status, idx) {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const currency = pick(CURRENCIES);
  const amount = randomAmount();
  const nameMismatch = Math.random() < 0.1;
  const originalFirstName = nameMismatch ? pick(FIRST_NAMES) : firstName;
  const originalLastName = nameMismatch ? pick(LAST_NAMES) : lastName;
  const originalOrderAmount = Math.random() < 0.65 ? amount : Math.round(amount * (0.85 + Math.random() * 0.3) * 100) / 100;
  const bank = pick(BANKS);
  const isFlagged = amount > 2000 || nameMismatch || Math.random() < 0.04;
  const riskTriggers = isFlagged
    ? [
        amount > 2000 ? `Montant élevé (${amount.toFixed(0)} ${currency})` : null,
        nameMismatch ? 'Nom bénéficiaire différent du paiement d\'origine' : null,
        !amount > 2000 && !nameMismatch ? 'Signalement automatique' : null,
      ].filter(Boolean).join(', ')
    : null;

  const createdDaysAgo = Math.floor(Math.random() * 45) + 1;
  const now = new Date();
  const createdAt = new Date(now.getTime() - createdDaysAgo * 86400000);

  const advanced = [RefundStatus.PENDING_LEAD_APPROVAL, RefundStatus.PENDING_FINAL_APPROVAL, RefundStatus.APPROVED_FOR_PAYMENT, RefundStatus.PAYMENT_PROCESSING, RefundStatus.PAID];
  const supervisorUp = [RefundStatus.APPROVED_FOR_PAYMENT, RefundStatus.PAYMENT_PROCESSING, RefundStatus.PAID];

  // IBAN is absent for statuses where the client hasn't submitted it yet
  // No IBAN for statuses where client hasn't submitted it yet
  const ibanAbsent = [
    RefundStatus.PENDING_AGENT_REVIEW,
    RefundStatus.AWAITING_CLIENT_VALIDATION,
    RefundStatus.RETURNED_TO_CLIENT_FOR_INFO,
  ].includes(status);

  return {
    ticketId: `TK-${String(10000 + idx).padStart(5, '0')}`,
    zendeskTicketId: Math.random() < 0.6 ? `ZD-${10000 + idx}` : null,
    clientFirstName: firstName,
    clientLastName: lastName,
    clientEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idx}@example.com`,
    clientAddress: `${Math.floor(Math.random() * 150) + 1} Rue de la République, ${Math.floor(Math.random() * 90000) + 10000} Paris`,
    amount,
    originalOrderAmount,
    currency,
    reason: pick(REASONS),
    iban: ibanAbsent ? null : randomIban(currency),
    bic: ibanAbsent ? null : bank.bic,
    bankName: ibanAbsent ? null : bank.name,
    bankAddress: ibanAbsent ? null : bank.address,
    paymentMethod: pick(PAYMENT_METHODS),
    paymentProviderTransactionId: `PAY-${Date.now()}-${idx}`,
    status,
    createdByRole: 'agent',
    orderId: `ORD-${Date.now()}-${idx}`,
    originalItemPaidFor: pick(ITEMS),
    originalCardUsed: `Visa **** ${Math.floor(Math.random() * 9000) + 1000}`,
    originalPaymentDate: new Date(createdAt.getTime() - Math.floor(Math.random() * 90) * 86400000),
    originalClientFirstName: originalFirstName,
    originalClientLastName: originalLastName,
    originalClientAddress: `${Math.floor(Math.random() * 150) + 1} Avenue Victor Hugo, ${Math.floor(Math.random() * 90000) + 10000} Paris`,
    isFlagged,
    riskTriggers,
    createdAt,
    paidAt: status === RefundStatus.PAID ? new Date() : null,
    agentNotes: advanced.includes(status) ? 'Dossier vérifié, pièces justificatives conformes.' : null,
    leadComments: [RefundStatus.PENDING_FINAL_APPROVAL, ...supervisorUp].includes(status) ? 'Validé après vérification du montant et des coordonnées bancaires.' : null,
    supervisorNotes: supervisorUp.includes(status) ? 'Approbation finale accordée.' : null,
    financeNotes: status === RefundStatus.PAID ? `Virement exécuté le ${new Date().toLocaleDateString('fr-FR')}.` : null,
  };
}

export async function POST() {
  try {
    // Clear existing data
    await prisma.auditLog.deleteMany({});
    await prisma.refundRequest.deleteMany({});

    // Build all refunds from distribution
    const allData = [];
    let idx = 1;
    for (const [status, count] of STATUS_DISTRIBUTION) {
      for (let i = 0; i < count; i++) {
        allData.push(buildRefund(status, idx++));
      }
    }

    // Insert all
    const created = await prisma.$transaction(
      allData.map(data => prisma.refundRequest.create({ data }))
    );

    // Build and insert audit logs
    const allLogs = [];
    for (let i = 0; i < created.length; i++) {
      const logs = buildAuditTrail(created[i].id, created[i].status, created[i].createdAt);
      allLogs.push(...logs);
    }
    await prisma.auditLog.createMany({ data: allLogs });

    return NextResponse.json({ success: true, count: created.length });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
