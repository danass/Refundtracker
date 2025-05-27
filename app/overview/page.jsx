'use client'
import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import Link from 'next/link';

async function getOverviewStats() {
  const totalRequests = await prisma.refundRequest.count();

  const statusCounts = await prisma.refundRequest.groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
  });

  const formattedStatusCounts = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {});

  const pendingAgentReviewCount = formattedStatusCounts[RefundStatus.PENDING_AGENT_REVIEW] || 0;
  const pendingLeadApprovalCount = formattedStatusCounts[RefundStatus.PENDING_LEAD_APPROVAL] || 0;
  const pendingSupervisorApprovalCount = formattedStatusCounts[RefundStatus.PENDING_FINAL_APPROVAL] || 0;
  const approvedForPaymentCount = formattedStatusCounts[RefundStatus.APPROVED_FOR_PAYMENT] || 0;
  const paymentProcessingCount = formattedStatusCounts[RefundStatus.PAYMENT_PROCESSING] || 0;
  const paidCount = formattedStatusCounts[RefundStatus.PAID] || 0;
  const rejectedCount = (formattedStatusCounts[RefundStatus.REJECTED_BY_AGENT] || 0) +
                        (formattedStatusCounts[RefundStatus.REJECTED_BY_LEAD] || 0) +
                        (formattedStatusCounts[RefundStatus.REJECTED_BY_SUPERVISOR] || 0);
  const clientActionCount = (formattedStatusCounts[RefundStatus.AWAITING_CLIENT_VALIDATION] || 0) +
                          (formattedStatusCounts[RefundStatus.RETURNED_TO_CLIENT_FOR_INFO] || 0);

  const paidAggregations = await prisma.refundRequest.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: RefundStatus.PAID,
    },
  });
  const totalPaid = paidAggregations._sum.amount || 0;

  // Fetch total count of distinct currencies for paid amounts
  const distinctCurrencies = await prisma.refundRequest.findMany({
    where: {
      status: RefundStatus.PAID,
      amount: {
        gt: 0 // Only consider if there's an amount
      }
    },
    select: {
      currency: true,
    },
    distinct: ['currency'],
  });

  return {
    totalRequests,
    pendingAgentReviewCount,
    pendingLeadApprovalCount,
    pendingSupervisorApprovalCount,
    approvedForPaymentCount,
    paymentProcessingCount,
    paidCount,
    rejectedCount,
    clientActionCount,
    totalPaid,
    distinctCurrencies: distinctCurrencies.map(item => item.currency)
  };
}

export default async function OverviewPage() {
  const stats = await getOverviewStats();

  const StatCard = ({ title, value, subValue, color = 'blue' }) => (
    <div className={`bg-white p-6 rounded-lg shadow-lg border-l-4 border-${color}-500`}>
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h2>
      <p className={`text-3xl font-bold text-gray-900 mt-1`}>{value}</p>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">System Overview</h1>
        <p className="text-gray-600 mt-1">
          Welcome to the RefundTracker. Here's a snapshot of current activity.
        </p>
      </div>

      {/* Quick Navigation - REMOVED
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Quick Access Dashboards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <Link href="/client" className="bg-blue-500 hover:bg-blue-600 text-white text-center font-semibold py-3 px-4 rounded-lg shadow transition duration-150 ease-in-out">Client View</Link>
          <Link href="/agent" className="bg-green-500 hover:bg-green-600 text-white text-center font-semibold py-3 px-4 rounded-lg shadow transition duration-150 ease-in-out">Agent Dashboard</Link>
          <Link href="/lead" className="bg-yellow-500 hover:bg-yellow-600 text-white text-center font-semibold py-3 px-4 rounded-lg shadow transition duration-150 ease-in-out">Lead Dashboard</Link>
          <Link href="/supervisor" className="bg-purple-500 hover:bg-purple-600 text-white text-center font-semibold py-3 px-4 rounded-lg shadow transition duration-150 ease-in-out">Supervisor Dashboard</Link>
          <Link href="/finance" className="bg-indigo-500 hover:bg-indigo-600 text-white text-center font-semibold py-3 px-4 rounded-lg shadow transition duration-150 ease-in-out">Finance Dashboard</Link>
        </div>
      </div>
      */}

      {/* Key Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Requests" value={stats.totalRequests} color="gray" />
          <StatCard 
            title="Total Paid Amount" 
            value={stats.totalPaid > 0 ? `${stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0.00'}
            subValue={stats.distinctCurrencies.length === 1 && stats.totalPaid > 0 ? stats.distinctCurrencies[0] : (stats.distinctCurrencies.length > 1 && stats.totalPaid > 0 ? '(Multiple Currencies)' : 'N/A')}
            color="green" 
          />
           <StatCard title="Requests Paid" value={stats.paidCount} color="teal" />
           <StatCard title="Requests Rejected" value={stats.rejectedCount} color="red" />
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Current Status Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard title="Pending Agent Review" value={stats.pendingAgentReviewCount} color="orange" />
          <StatCard title="Pending Lead Approval" value={stats.pendingLeadApprovalCount} color="yellow" />
          <StatCard title="Pending Supervisor Approval" value={stats.pendingSupervisorApprovalCount} color="purple" />
          <StatCard title="Awaiting Client Action" value={stats.clientActionCount} color="pink" />
          <StatCard title="Approved for Payment" value={stats.approvedForPaymentCount} color="cyan" />
          <StatCard title="Payment Processing" value={stats.paymentProcessingCount} color="blue" />
        </div>
      </div>

      {/* Placeholder for Charts - Future Enhancement */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Refund Status Distribution</h2>
        <div className="space-y-2">
          {stats.pendingAgentReviewCount > 0 && <BarChartItem label="Pending Agent Review" value={stats.pendingAgentReviewCount} maxValue={stats.totalRequests} color="bg-orange-500" />}
          {stats.pendingLeadApprovalCount > 0 && <BarChartItem label="Pending Lead Approval" value={stats.pendingLeadApprovalCount} maxValue={stats.totalRequests} color="bg-yellow-500" />}
          {stats.pendingSupervisorApprovalCount > 0 && <BarChartItem label="Pending Supervisor Approval" value={stats.pendingSupervisorApprovalCount} maxValue={stats.totalRequests} color="bg-purple-500" />}
          {stats.clientActionCount > 0 && <BarChartItem label="Awaiting Client Action" value={stats.clientActionCount} maxValue={stats.totalRequests} color="bg-pink-500" />}
          {stats.approvedForPaymentCount > 0 && <BarChartItem label="Approved for Payment" value={stats.approvedForPaymentCount} maxValue={stats.totalRequests} color="bg-cyan-500" />}
          {stats.paymentProcessingCount > 0 && <BarChartItem label="Payment Processing" value={stats.paymentProcessingCount} maxValue={stats.totalRequests} color="bg-blue-500" />}
          {stats.paidCount > 0 && <BarChartItem label="Paid" value={stats.paidCount} maxValue={stats.totalRequests} color="bg-teal-500" />}
          {stats.rejectedCount > 0 && <BarChartItem label="Rejected" value={stats.rejectedCount} maxValue={stats.totalRequests} color="bg-red-500" />}
        </div>
      </div>

    </div>
  );
}

const BarChartItem = ({ label, value, maxValue, color }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center">
      <span className="w-1/3 text-sm text-gray-600 truncate pr-2">{label} ({value})</span>
      <div className="w-2/3 bg-gray-200 rounded-full h-5 overflow-hidden">
        <div 
          className={`${color} h-5 text-xs font-medium text-white text-center p-0.5 leading-none rounded-full`} 
          style={{ width: `${percentage}%` }}
        >
          {/* {value} */}
        </div>
      </div>
    </div>
  );
}; 