-- CreateTable
CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clientFirstName" TEXT NOT NULL,
    "clientLastName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientAddress" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "bankName" TEXT,
    "bankAddress" TEXT,
    "paymentMethod" TEXT,
    "paymentProviderTransactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdByRole" TEXT NOT NULL,
    "agentNotes" TEXT,
    "leadComments" TEXT,
    "supervisorNotes" TEXT,
    "financeNotes" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "riskTriggers" TEXT
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refundRequestId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "actionDescription" TEXT NOT NULL,
    "fieldChanges" TEXT,
    CONSTRAINT "AuditLog_refundRequestId_fkey" FOREIGN KEY ("refundRequestId") REFERENCES "RefundRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RefundRequest_orderId_key" ON "RefundRequest"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRequest_orderId_clientEmail_key" ON "RefundRequest"("orderId", "clientEmail");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
