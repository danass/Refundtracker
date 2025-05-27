require('dotenv').config();
const { PrismaClient, RefundStatus } = require('@prisma/client');
const prisma = new PrismaClient();

const USER_ROLES = ['client', 'agent', 'team_lead', 'supervisor', 'finance'];
const CURRENCIES = ['USD', 'EUR', 'GBP'];
const PAYMENT_METHODS = ['CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL'];
const REASONS = [
  'Cancelled subscription within 15 days',
  'Accidental purchase',
  'Product not as described',
  'Service not delivered',
  'Technical issue with product',
  'Duplicate charge',
  'Fraudulent transaction reported by user',
  'Goodwill gesture',
  'Price adjustment',
  'Order not received'
];
const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Laura', 'Michael', 'Nora', 'Oscar', 'Penelope', 'Quentin', 'Rachel', 'Samuel', 'Tina'];
const LAST_NAMES = ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark'];
const ADDRESS_STREETS = ['Main St', 'High St', 'Park Ave', 'Elm St', 'Oak St', 'Pine St', 'Maple Ave', 'Cedar Rd', 'Washington Blvd', 'Lakeview Dr'];
const ADDRESS_CITIES = ['Springfield', 'Riverside', 'Fairview', 'Madison', 'Georgetown', 'Arlington', 'Oxford', 'Salem', 'Newport', 'Centerville'];
const ADDRESS_COUNTRIES = ['USA', 'UK', 'Canada', 'Germany', 'France', 'Australia'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

function generateRandomIBAN() {
  // Simplified IBAN generation (Country Code + 2 check digits + BBAN (up to 30 chars))
  const countryCode = getRandomElement(['DE', 'FR', 'GB', 'ES', 'IT']);
  const checkDigits = String(getRandomInt(10, 99));
  let bban = '';
  for (let i = 0; i < getRandomInt(15, 22); i++) {
    bban += String(getRandomInt(0, 9));
  }
  return `${countryCode}${checkDigits}${bban}`;
}

function generateRandomBIC() {
  // Simplified BIC (SWIFT) generation (Bank Code (4A) + Country Code (2A) + Location Code (2AN) + [Branch Code (3AN)])
  let bic = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const alphanum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 4; i++) bic += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 2; i++) bic += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 2; i++) bic += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
  if (Math.random() > 0.5) {
    for (let i = 0; i < 3; i++) bic += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
  }
  return bic;
}

// Function to generate a custom refund ticket ID
function generateRefundTicketId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'REFUND-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  console.log('Starting mass seed script...');
  const numRequests = 300;
  const refundRequests = [];

  const allStatuses = Object.values(RefundStatus);

  for (let i = 0; i < numRequests; i++) {
    const clientFirstName = getRandomElement(FIRST_NAMES);
    const clientLastName = getRandomElement(LAST_NAMES);
    const amount = getRandomFloat(10, 2500, 2);
    const originalOrderAmount = Math.random() > 0.2 ? getRandomFloat(amount * 0.8, amount * 1.5, 2) : amount;
    const createdAt = new Date(Date.now() - getRandomInt(0, 30 * 24 * 60 * 60 * 1000)); // Within last 30 days
    const updatedAt = new Date(createdAt.getTime() + getRandomInt(0, 5 * 24 * 60 * 60 * 1000)); // Updated within 5 days of creation
    
    const status = getRandomElement(allStatuses);
    let paidAt = null;
    if (status === RefundStatus.PAID) {
        paidAt = new Date(updatedAt.getTime() + getRandomInt(1, 5 * 24 * 60 * 60 * 1000));
    }

    // Ensure original payment details are always populated
    const originalClientFirstName = Math.random() < 0.2 ? getRandomElement(FIRST_NAMES) : clientFirstName; // 20% chance of different name
    const originalClientLastName = Math.random() < 0.2 ? getRandomElement(LAST_NAMES) : clientLastName;  // 20% chance of different name
    const originalClientAddress =  `${getRandomInt(1,1000)} ${getRandomElement(ADDRESS_STREETS)}, ${getRandomElement(ADDRESS_CITIES)}, ${getRandomElement(ADDRESS_COUNTRIES)}`;

    const request = {
      ticketId: generateRefundTicketId(),
      clientFirstName,
      clientLastName,
      clientEmail: `${clientFirstName.toLowerCase()}.${clientLastName.toLowerCase()}${getRandomInt(1,100)}@example.com`,
      clientAddress: `${getRandomInt(1,1000)} ${getRandomElement(ADDRESS_STREETS)}, ${getRandomElement(ADDRESS_CITIES)}, ${getRandomElement(ADDRESS_COUNTRIES)}`,
      amount,
      currency: getRandomElement(CURRENCIES),
      reason: getRandomElement(REASONS),
      status,
      paymentMethod: getRandomElement(PAYMENT_METHODS),
      createdByRole: getRandomElement(USER_ROLES),
      createdAt,
      updatedAt,
      paidAt,
      isFlagged: Math.random() < 0.15, // 15% chance of being flagged
      riskTriggers: Math.random() < 0.1 ? 'High amount, New customer' : null,
      originalOrderAmount,
      paymentProviderTransactionId: `txn_${Date.now()}${getRandomInt(1000,9999)}`,
      zendeskTicketId: Math.random() > 0.5 ? `ZENDESK-${getRandomInt(10000, 99999)}` : null,
      iban: Math.random() > 0.3 ? generateRandomIBAN() : null,
      bic: Math.random() > 0.4 ? generateRandomBIC() : null,
      internalNotes: Math.random() > 0.4 ? `Internal note for request ${i+1}: please double check details for ${clientFirstName} ${clientLastName}. Escalation reason: ${getRandomElement(REASONS)}.` : null, // More detailed internal notes sometimes
      // Placeholders for new fields from recent refund detail page update - ensure they are always populated
      originalItemPaidFor: getRandomElement(['1 Year Subscription for Analytics Pro', 'Premium Widget X2000', 'Software License - Business Tier', 'Cloud Storage - 1TB Plan', 'Advanced e-Book on Quantum Physics']),
      originalCardUsed: `${getRandomElement(['Visa', 'Mastercard', 'Amex'])} **** ${getRandomInt(1000,9999)}`,
      originalPaymentDate: new Date(createdAt.getTime() - getRandomInt(5, 90 * 24 * 60 * 60 * 1000)), // Paid 5-90 days before refund request
      originalClientFirstName, // Use the always-populated variable
      originalClientLastName,  // Use the always-populated variable
      originalClientAddress,   // Use the always-populated variable
    };
    refundRequests.push(request);
  }

  try {
    // Using createMany for better performance if your DB supports it well (SQLite does)
    const result = await prisma.refundRequest.createMany({
      data: refundRequests,
    });
    console.log(`Successfully seeded ${result.count} refund requests.`);

    // Additionally, create some audit logs for a few requests to make history look more real
    const someRequestsForAudit = await prisma.refundRequest.findMany({ take: 20 });
    for (const req of someRequestsForAudit) {
        const numLogs = getRandomInt(1, 5);
        let currentStatus = req.status;
        for (let j=0; j < numLogs; j++) {
            const newStatus = getRandomElement(allStatuses.filter(s => s !== currentStatus)); // pick a different status
            await prisma.auditLog.create({
                data: {
                    refundRequestId: req.id,
                    actorRole: getRandomElement(USER_ROLES),
                    actorName: `${getRandomElement(FIRST_NAMES)} (Bot)`,
                    actionDescription: `Status changed from ${currentStatus} to ${newStatus}`,
                    previousStatus: currentStatus,
                    newStatus: newStatus,
                    fieldChanges: `Automated log entry ${j+1}`
                }
            });
            currentStatus = newStatus; // update for next potential log entry for this request
        }
    }
    console.log(`Created audit logs for ${someRequestsForAudit.length} requests.`);


  } catch (e) {
    console.error('Error seeding database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 