const { PrismaClient, RefundStatus } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const users = [];
  const roles = ['client', 'agent', 'team_lead', 'supervisor', 'finance'];
  for (let i = 0; i < 5; i++) {
    const role = roles[i % roles.length];
    const user = await prisma.user.upsert({
      where: { email: `${role}${i}@example.com` },
      update: {},
      create: {
        id: uuidv4(),
        name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${i}`,
        email: `${role}${i}@example.com`,
        role: role,
      },
    });
    users.push(user);
    console.log(`Created/found user ${user.name} with id: ${user.id}`);
  }
  // const clientUser = users.find(u => u.role === 'client'); // Not strictly needed if not linking directly
  // const agentUser = users.find(u => u.role === 'agent'); // Not strictly needed


  const refundRequestIdClientPage = 'REPLACE_WITH_A_CLIENT_REQUEST_ID_FROM_SEED';
  await prisma.refundRequest.upsert({
    where: { id: refundRequestIdClientPage },
    update: {},
    create: {
      id: refundRequestIdClientPage,
      ticketId: 'TICKET-CLIENT-PAGE',
      clientFirstName: 'Alice',
      clientLastName: 'Wonderland',
      clientEmail: 'alice.wonder@example.com',
      amount: 150.75,
      originalOrderAmount: 160.00,
      currency: 'USD',
      reason: 'Incorrect item shipped, needed for client page.',
      status: RefundStatus.PENDING_AGENT_REVIEW,
      createdByRole: 'client', // This field indicates who created it
      agentNotes: 'Initial review pending for client page ticket.',
      orderId: `ORD-MAIN-${Date.now()}`,
      // agentId: agentUser?.id, // Removed
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      bankName: 'Commerzbank',
      bankAddress: 'Kaiserplatz, 60311 Frankfurt am Main, Germany',
      paymentMethod: 'BANK_TRANSFER',
      paymentProviderTransactionId: `PAY-${Date.now()}`,
      isFlagged: false,
    },
  });
  console.log(`Created/updated refund request for client page with id: ${refundRequestIdClientPage}`);

  const statuses = Object.values(RefundStatus);
  const reasons = [
    'Product defective', 'Wrong item received', 'Not as described', 'Damaged in transit', 
    'Changed mind', 'Better price available', 'Subscription cancellation', 'Service not rendered',
    'Duplicate order', 'Accidental order'
  ];
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Laura', 'Kevin', 'Anna'];
  const lastNames = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez'];
  const currencyCodes = ['USD', 'EUR', 'GBP'];

  // Suspicious Data Points
  const suspiciousIban = 'FR7630006000011234567890188';
  const suspiciousEmail = 'suspicious.user@example.com';
  const suspiciousFirstName = 'Alex';
  const suspiciousLastName = 'Fraudster';

  // Create requests with some duplicated/suspicious data
  const knownSuspiciousId1 = "a1b2c3d4-e5f6-7777-8888-999999999991";
  // const knownSuspiciousId2 = "a1b2c3d4-e5f6-7777-8888-999999999992"; // Reduced

  const suspiciousDataBase = [
    { 
      id: knownSuspiciousId1,
      clientFirstName: 'Suspicious', clientLastName: 'One',
      clientEmail: 'suspicious1@example.com', iban: suspiciousIban, 
      orderId: `ORD-SUSP-IBAN1-${Date.now()}`,
      isFlagged: true, riskTriggers: 'Duplicate IBAN detected',
      amount: 750.00, // Example amount for this flagged one
      status: RefundStatus.PENDING_AGENT_REVIEW
    },
    // Removed other predefined suspicious entries to reduce count
    {
      clientFirstName: suspiciousFirstName, clientLastName: suspiciousLastName,
      clientEmail: 'alex.fraudster1@example.com', iban: 'GB98BARC20038439027837',
      orderId: `ORD-SUSP-NAME1-${Date.now()}`,
      isFlagged: true, riskTriggers: 'Known Fraudulent Name Pattern',
      amount: 1200.00, // Example high amount for supervisor review path
      status: RefundStatus.PENDING_AGENT_REVIEW
    }
  ];

  for (const data of suspiciousDataBase) {
    const idToUse = data.id || uuidv4();
    await prisma.refundRequest.upsert({
      where: { id: idToUse }, 
      update: { 
        clientFirstName: data.clientFirstName,
        clientLastName: data.clientLastName,
        clientEmail: data.clientEmail,
        iban: data.iban,
        orderId: data.orderId,
        isFlagged: data.isFlagged,
        riskTriggers: data.riskTriggers,
        ticketId: data.ticketId || `TICKET-SUSP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        amount: data.amount || parseFloat((Math.random() * 500 + 50).toFixed(2)),
        originalOrderAmount: data.originalOrderAmount || parseFloat(((data.amount || Math.random() * 500 + 50) * 1.1).toFixed(2)),
        currency: data.currency || currencyCodes[Math.floor(Math.random() * currencyCodes.length)],
        reason: data.reason || 'Suspicious activity test case',
        status: data.status || RefundStatus.PENDING_AGENT_REVIEW,
        createdByRole: data.createdByRole || 'client',
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
      },
      create: {
        ...data,
        id: idToUse,
        ticketId: data.ticketId || `TICKET-SUSP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        amount: data.amount || parseFloat((Math.random() * 500 + 50).toFixed(2)),
        originalOrderAmount: data.originalOrderAmount || parseFloat(((data.amount || Math.random() * 500 + 50) * 1.1).toFixed(2)),
        currency: data.currency || currencyCodes[Math.floor(Math.random() * currencyCodes.length)],
        reason: data.reason || 'Suspicious activity test case',
        status: data.status || RefundStatus.PENDING_AGENT_REVIEW,
        createdByRole: data.createdByRole || 'client',
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
        clientFirstName: data.clientFirstName, 
        clientLastName: data.clientLastName, 
        clientEmail: data.clientEmail, 
        iban: data.iban, 
        orderId: data.orderId,
        isFlagged: data.isFlagged !== undefined ? data.isFlagged : false,
      }
    });
  }
  console.log(`Upserted ${suspiciousDataBase.length} suspicious refund requests.`);
  console.log(`Known suspicious ID 1: ${knownSuspiciousId1}`);
  // console.log(`Known suspicious ID 2: ${knownSuspiciousId2}`); // Removed

  // Create some requests specifically AWAITING_CLIENT_VALIDATION
  const knownClientValidationId1 = "a1b2c3d4-e5f6-1111-2222-333333333331";
  const knownClientValidationId2 = "a1b2c3d4-e5f6-1111-2222-333333333332";

  const clientValidationData = [
    {
      id: knownClientValidationId1,
      ticketId: `TICKET-ACV-01`,
      clientFirstName: firstNames[5 % firstNames.length],
      clientLastName: lastNames[5 % lastNames.length],
      clientEmail: `${firstNames[5 % firstNames.length].toLowerCase()}acv.${lastNames[5 % lastNames.length].toLowerCase()}0@example.com`,
      amount: parseFloat((Math.random() * 100 + 5).toFixed(2)),
      currency: currencyCodes[0 % currencyCodes.length],
      reason: 'Initial request, pending client confirmation',
      status: RefundStatus.AWAITING_CLIENT_VALIDATION,
      createdByRole: 'client',
      orderId: `ORD-ACV-${Date.now() + 0}`,
      paymentMethod: 'CREDIT_CARD',
      isFlagged: false,
    },
    {
      id: knownClientValidationId2,
      ticketId: `TICKET-ACV-02`,
      clientFirstName: firstNames[6 % firstNames.length],
      clientLastName: lastNames[6 % lastNames.length],
      clientEmail: `${firstNames[6 % firstNames.length].toLowerCase()}acv.${lastNames[6 % lastNames.length].toLowerCase()}1@example.com`,
      amount: parseFloat((Math.random() * 100 + 5).toFixed(2)),
      currency: currencyCodes[1 % currencyCodes.length],
      reason: 'Initial request, pending client confirmation',
      status: RefundStatus.AWAITING_CLIENT_VALIDATION,
      createdByRole: 'client',
      orderId: `ORD-ACV-${Date.now() + 1}`,
      paymentMethod: 'CREDIT_CARD',
      isFlagged: false,
    }
  ];

  for (const data of clientValidationData) {
    await prisma.refundRequest.upsert({
      where: { id: data.id },
      update: { ...data, id: undefined },
      create: data
    });
  }
  console.log(`Upserted ${clientValidationData.length} requests AWAITING_CLIENT_VALIDATION.`);
  console.log(`Known client validation ID 1: ${knownClientValidationId1}`);
  console.log(`Known client validation ID 2: ${knownClientValidationId2}`);

  const knownRegularId1 = "a1b2c3d4-e5f6-4444-5555-666666666661";
  const knownRegularId2 = "a1b2c3d4-e5f6-4444-5555-666666666662";
  const numberOfRegularRequests = 550; // Increased number of regular requests

  for (let i = 0; i < numberOfRegularRequests; i++) { // Use the new variable
    const randomStatus = statuses[i % statuses.length];
    const randomReason = reasons[i % reasons.length];
    const randomFirstName = firstNames[i % firstNames.length];
    const randomLastName = lastNames[i % lastNames.length];
    const randomCurrencyCode = currencyCodes[i % currencyCodes.length];
    const createdBy = roles[i % 2 === 0 ? 0 : 1];

    const idToUse = i === 0 ? knownRegularId1 : (i === 1 ? knownRegularId2 : uuidv4());
    const ticketIdToUse = i === 0 ? 'TICKET-001' : (i === 1 ? 'TICKET-002' : `TICKET-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);

    const baseAmount = parseFloat((Math.random() * 200 + 10).toFixed(2));
    const createData = {
      id: idToUse,
      ticketId: ticketIdToUse,
      clientFirstName: randomFirstName,
      clientLastName: randomLastName,
      clientEmail: `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}${i}@example.com`,
      amount: baseAmount,
      originalOrderAmount: parseFloat((baseAmount * (1 + Math.random() * 0.2)).toFixed(2)),
      currency: randomCurrencyCode,
      reason: randomReason,
      status: randomStatus,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
      updatedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
      createdByRole: createdBy,
      orderId: `ORD-REG-${Date.now() + i}`,
      iban: `DE${Math.floor(Math.random() * 10**20).toString().padStart(20, '0')}`,
      bic: 'MARKDEF1XXX',
      bankName: 'Deutsche Bank',
      bankAddress: 'Taunusanlage 12, 60325 Frankfurt am Main, Germany',
      paymentMethod: 'SEPA_TRANSFER',
      isFlagged: (randomStatus === RefundStatus.PENDING_AGENT_REVIEW && Math.random() < 0.1), // 10% chance of flagging for agent review
      riskTriggers: (randomStatus === RefundStatus.PENDING_AGENT_REVIEW && Math.random() < 0.1) ? 'Randomly flagged for review' : null,
    };

    await prisma.refundRequest.upsert({
      where: { id: idToUse },
      update: createData, 
      create: createData,
    });
  }
  console.log(`Upserted ${numberOfRegularRequests} additional regular refund requests.`); // Updated count
  console.log(`Known regular ID 1 (TICKET-001): ${knownRegularId1}`);
  console.log(`Known regular ID 2 (TICKET-002): ${knownRegularId2}`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 