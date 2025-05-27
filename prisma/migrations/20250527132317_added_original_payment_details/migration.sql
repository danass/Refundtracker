-- AlterTable
ALTER TABLE "RefundRequest" ADD COLUMN "originalCardUsed" TEXT;
ALTER TABLE "RefundRequest" ADD COLUMN "originalClientAddress" TEXT;
ALTER TABLE "RefundRequest" ADD COLUMN "originalClientFirstName" TEXT;
ALTER TABLE "RefundRequest" ADD COLUMN "originalClientLastName" TEXT;
ALTER TABLE "RefundRequest" ADD COLUMN "originalItemPaidFor" TEXT;
ALTER TABLE "RefundRequest" ADD COLUMN "originalPaymentDate" DATETIME;
ALTER TABLE "RefundRequest" ADD COLUMN "zendeskTicketId" TEXT;
