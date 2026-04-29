import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import DbControls from '@/components/DbControls';

const BORDER = 'hsl(220,13%,89%)';

const PIPELINE_STATUSES = [
  RefundStatus.PENDING_AGENT_REVIEW,
  RefundStatus.RETURNED_TO_AGENT_FOR_EDITS,
  RefundStatus.PENDING_LEAD_APPROVAL,
  RefundStatus.PENDING_FINAL_APPROVAL,
  RefundStatus.APPROVED_FOR_PAYMENT,
  RefundStatus.PAYMENT_PROCESSING,
  RefundStatus.AWAITING_CLIENT_VALIDATION,
  RefundStatus.RETURNED_TO_CLIENT_FOR_INFO,
];

const REJECTED_STATUSES = [
  RefundStatus.REJECTED_BY_AGENT,
  RefundStatus.REJECTED_BY_LEAD,
  RefundStatus.REJECTED_BY_SUPERVISOR,
];

async function getOverviewStats() {
  const totalRequests = await prisma.refundRequest.count();

  const statusCounts = await prisma.refundRequest.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const byStatus = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {});

  const paidAgg = await prisma.refundRequest.aggregate({
    _sum: { amount: true },
    where: { status: RefundStatus.PAID },
  });

  const distinctCurrencies = await prisma.refundRequest.findMany({
    where: { status: RefundStatus.PAID, amount: { gt: 0 } },
    select: { currency: true },
    distinct: ['currency'],
  });

  const flaggedCount = await prisma.refundRequest.count({ where: { isFlagged: true } });

  // ── Approval rate (PAID vs rejected) ─────────────────────────────────
  const paidCount = byStatus[RefundStatus.PAID] || 0;
  const rejectedCount = REJECTED_STATUSES.reduce((s, st) => s + (byStatus[st] || 0), 0);
  const decided = paidCount + rejectedCount;
  const approvalRate = decided > 0 ? Math.round((paidCount / decided) * 100) : null;

  // ── Avg processing time (createdAt → paidAt) ─────────────────────────
  const paidRows = await prisma.refundRequest.findMany({
    where: { status: RefundStatus.PAID, paidAt: { not: null } },
    select: { createdAt: true, paidAt: true },
  });
  let avgProcessingHours = null;
  if (paidRows.length > 0) {
    const sumMs = paidRows.reduce((s, r) => s + (r.paidAt.getTime() - r.createdAt.getTime()), 0);
    avgProcessingHours = sumMs / paidRows.length / 3_600_000;
  }

  // ── Active pipeline count ────────────────────────────────────────────
  const pipelineActiveCount = PIPELINE_STATUSES.reduce((s, st) => s + (byStatus[st] || 0), 0);

  // ── Anomaly total ────────────────────────────────────────────────────
  const anomaliesTotal =
    flaggedCount +
    (byStatus[RefundStatus.RETURNED_TO_AGENT_FOR_EDITS] || 0) +
    (byStatus[RefundStatus.RETURNED_TO_CLIENT_FOR_INFO] || 0) +
    (byStatus[RefundStatus.ERROR_PROCESSING_PAYMENT] || 0);

  // ── 14-day volume (created vs paid) ──────────────────────────────────
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const fourteenAgo = new Date(today);
  fourteenAgo.setDate(fourteenAgo.getDate() - 13);
  fourteenAgo.setHours(0, 0, 0, 0);

  const recentForVolume = await prisma.refundRequest.findMany({
    where: {
      OR: [
        { createdAt: { gte: fourteenAgo } },
        { paidAt: { gte: fourteenAgo } },
      ],
    },
    select: { createdAt: true, paidAt: true, status: true },
  });

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({ date: d, key: d.toISOString().slice(0, 10), created: 0, paid: 0 });
  }
  const dayMap = Object.fromEntries(days.map(d => [d.key, d]));
  for (const r of recentForVolume) {
    const cKey = r.createdAt.toISOString().slice(0, 10);
    if (dayMap[cKey]) dayMap[cKey].created++;
    if (r.paidAt) {
      const pKey = r.paidAt.toISOString().slice(0, 10);
      if (dayMap[pKey]) dayMap[pKey].paid++;
    }
  }

  // ── Top reasons ──────────────────────────────────────────────────────
  const reasonGroup = await prisma.refundRequest.groupBy({
    by: ['reason'],
    _count: { reason: true },
    where: { reason: { not: null } },
    orderBy: { _count: { reason: 'desc' } },
    take: 5,
  });
  const topReasons = reasonGroup.map(r => ({ label: r.reason || '—', count: r._count.reason }));

  // ── Currency breakdown (paid amounts) ────────────────────────────────
  const currencyGroup = await prisma.refundRequest.groupBy({
    by: ['currency'],
    _sum: { amount: true },
    _count: { currency: true },
    where: { status: RefundStatus.PAID },
    orderBy: { _sum: { amount: 'desc' } },
  });
  const currencyBreakdown = currencyGroup.map(c => ({
    currency: c.currency,
    total: c._sum.amount || 0,
    count: c._count.currency,
  }));

  // ── Payment method breakdown ─────────────────────────────────────────
  const paymentGroup = await prisma.refundRequest.groupBy({
    by: ['paymentMethod'],
    _count: { paymentMethod: true },
    where: { paymentMethod: { not: null } },
    orderBy: { _count: { paymentMethod: 'desc' } },
  });
  const paymentBreakdown = paymentGroup.map(p => ({
    label: p.paymentMethod || '—',
    count: p._count.paymentMethod,
  }));

  // ── Recent activity ──────────────────────────────────────────────────
  const recentActivity = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 8,
    select: {
      id: true,
      actorRole: true,
      actorName: true,
      timestamp: true,
      newStatus: true,
      previousStatus: true,
      actionDescription: true,
      refundRequest: { select: { ticketId: true, clientFirstName: true, clientLastName: true } },
    },
  });

  return {
    totalRequests,
    byStatus,
    totalPaid: paidAgg._sum.amount || 0,
    distinctCurrencies: distinctCurrencies.map(i => i.currency),
    flaggedCount,
    approvalRate,
    paidCount,
    rejectedCount,
    avgProcessingHours,
    pipelineActiveCount,
    anomaliesTotal,
    days,
    topReasons,
    currencyBreakdown,
    paymentBreakdown,
    recentActivity,
  };
}

// ── Mini SVG donut chart ──────────────────────────────────────────────
function Donut({ segments, size = 80, thickness = 14 }) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={thickness} />
      </svg>
    );
  }

  let offset = 0;
  const paths = segments.map((seg, i) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const el = (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={thickness}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={thickness} />
      {paths}
    </svg>
  );
}

function DonutCard({ title, segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const visible = segments.filter(s => s.value > 0);
  return (
    <div className="bg-white rounded-lg border p-5 flex flex-col gap-4" style={{ borderColor: BORDER }}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <Donut segments={visible} size={80} thickness={13} />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">{total}</span>
        </div>
        <ul className="space-y-1.5 flex-1 min-w-0">
          {visible.map(seg => (
            <li key={seg.label} className="flex items-center gap-2 text-xs text-gray-600 truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="flex-1 truncate">{seg.label}</span>
              <span className="font-semibold text-gray-800 shrink-0">{seg.value}</span>
            </li>
          ))}
          {visible.length === 0 && <li className="text-xs text-gray-400">Aucune demande</li>}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, tone = 'default' }) {
  const toneClass = tone === 'good' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-lg border p-5" style={{ borderColor: BORDER }}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      <p className={`text-3xl font-bold ${toneClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Compact 14-day stacked bar chart ─────────────────────────────────
function VolumeChart({ days }) {
  const max = Math.max(1, ...days.map(d => Math.max(d.created, d.paid)));
  const width = 560;
  const height = 140;
  const barW = width / days.length - 6;
  return (
    <div className="bg-white rounded-lg border p-5" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Volume sur 14 jours</p>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-800" /> Créées</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Payées</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        {days.map((d, i) => {
          const x = i * (barW + 6) + 3;
          const hCreated = (d.created / max) * (height - 24);
          const hPaid = (d.paid / max) * (height - 24);
          const yCreated = height - 16 - hCreated;
          const yPaid = height - 16 - hPaid;
          return (
            <g key={d.key}>
              <rect x={x} y={yCreated} width={barW / 2 - 1} height={hCreated} fill="#1f2937" rx="1.5" />
              <rect x={x + barW / 2 + 1} y={yPaid} width={barW / 2 - 1} height={hPaid} fill="#10b981" rx="1.5" />
              {(i === 0 || i === days.length - 1 || i === 7) && (
                <text x={x + barW / 2} y={height - 2} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 9 }}>
                  {d.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Horizontal bars ──────────────────────────────────────────────────
function HBarsCard({ title, items, valueKey = 'count', labelKey = 'label', emptyText = 'Aucune donnée' }) {
  const max = Math.max(1, ...items.map(i => i[valueKey]));
  const total = items.reduce((s, i) => s + i[valueKey], 0);
  return (
    <div className="bg-white rounded-lg border p-5" style={{ borderColor: BORDER }}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it, idx) => {
            const v = it[valueKey];
            const pct = total > 0 ? Math.round((v / total) * 100) : 0;
            const w = (v / max) * 100;
            return (
              <li key={idx}>
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="text-gray-700 truncate pr-3">{it[labelKey]}</span>
                  <span className="text-gray-400 shrink-0"><span className="font-semibold text-gray-800">{v}</span> · {pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-800 rounded-full" style={{ width: `${w}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Currency card ────────────────────────────────────────────────────
function CurrencyCard({ items }) {
  return (
    <div className="bg-white rounded-lg border p-5" style={{ borderColor: BORDER }}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Remboursé par devise</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">Aucun paiement</p>
      ) : (
        <ul className="space-y-3">
          {items.map(c => (
            <li key={c.currency} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0" style={{ borderColor: BORDER }}>
              <div>
                <p className="text-sm font-semibold text-gray-800">{c.currency}</p>
                <p className="text-[11px] text-gray-400">{c.count} demande{c.count > 1 ? 's' : ''}</p>
              </div>
              <p className="text-sm font-bold text-gray-900 tabular-nums">
                {c.total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Activity feed ────────────────────────────────────────────────────
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'à l’instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

const ROLE_COLOR = {
  agent: '#f97316',
  team_lead: '#f59e0b',
  supervisor: '#8b5cf6',
  finance: '#06b6d4',
  client: '#ec4899',
  system: '#9ca3af',
};

function ActivityCard({ items }) {
  return (
    <div className="bg-white rounded-lg border p-5" style={{ borderColor: BORDER }}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Activité récente</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">Aucune activité</p>
      ) : (
        <ul className="space-y-3">
          {items.map(a => {
            const color = ROLE_COLOR[a.actorRole] || ROLE_COLOR.system;
            const ticket = a.refundRequest?.ticketId
              || (a.refundRequest ? `${a.refundRequest.clientFirstName ?? ''} ${a.refundRequest.clientLastName ?? ''}`.trim() : '');
            return (
              <li key={a.id} className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate">
                    <span className="font-semibold text-gray-900">{a.actorName || a.actorRole}</span>
                    {' · '}
                    <span>{a.actionDescription}</span>
                    {ticket && <span className="text-gray-400"> · {ticket}</span>}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(a.timestamp)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────
export default async function OverviewPage() {
  const stats = await getOverviewStats();
  const {
    byStatus: b,
    totalRequests,
    totalPaid,
    distinctCurrencies,
    flaggedCount,
    approvalRate,
    paidCount,
    rejectedCount,
    avgProcessingHours,
    pipelineActiveCount,
    anomaliesTotal,
    days,
    topReasons,
    currencyBreakdown,
    paymentBreakdown,
    recentActivity,
  } = stats;

  const get = (s) => b[s] || 0;

  const paidLabel = distinctCurrencies.length === 1 && totalPaid > 0
    ? distinctCurrencies[0]
    : distinctCurrencies.length > 1 ? 'devises mixtes' : '';

  const procDisplay =
    avgProcessingHours == null ? '—'
      : avgProcessingHours < 24 ? `${avgProcessingHours.toFixed(1)} h`
        : `${(avgProcessingHours / 24).toFixed(1)} j`;

  const pipelineSegments = [
    { label: 'Agent', value: get(RefundStatus.PENDING_AGENT_REVIEW) + get(RefundStatus.RETURNED_TO_AGENT_FOR_EDITS), color: '#f97316' },
    { label: 'Responsable', value: get(RefundStatus.PENDING_LEAD_APPROVAL), color: '#f59e0b' },
    { label: 'Superviseur', value: get(RefundStatus.PENDING_FINAL_APPROVAL), color: '#8b5cf6' },
    { label: 'Finance', value: get(RefundStatus.APPROVED_FOR_PAYMENT) + get(RefundStatus.PAYMENT_PROCESSING), color: '#06b6d4' },
    { label: 'Client', value: get(RefundStatus.AWAITING_CLIENT_VALIDATION) + get(RefundStatus.RETURNED_TO_CLIENT_FOR_INFO), color: '#ec4899' },
  ];

  const outcomeSegments = [
    { label: 'Remboursé', value: get(RefundStatus.PAID), color: '#10b981' },
    { label: 'Rejeté', value: get(RefundStatus.REJECTED_BY_AGENT) + get(RefundStatus.REJECTED_BY_LEAD) + get(RefundStatus.REJECTED_BY_SUPERVISOR), color: '#ef4444' },
    { label: 'Annulé', value: get(RefundStatus.CANCELLED_BY_AGENT) + get(RefundStatus.CANCELLED_BY_CLIENT), color: '#9ca3af' },
    { label: 'Erreur paiement', value: get(RefundStatus.ERROR_PROCESSING_PAYMENT), color: '#f43f5e' },
  ];

  const anomalySegments = [
    { label: 'Signalées', value: flaggedCount, color: '#f59e0b' },
    { label: 'Retournées agent', value: get(RefundStatus.RETURNED_TO_AGENT_FOR_EDITS), color: '#f97316' },
    { label: 'Info client manquante', value: get(RefundStatus.RETURNED_TO_CLIENT_FOR_INFO), color: '#ec4899' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
          <p className="text-sm text-gray-500 mt-0.5">Activité en cours</p>
        </div>
        <DbControls />
      </div>

      {/* KPIs — 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard title="Total demandes" value={totalRequests} />
        <StatCard
          title="Montant remboursé"
          value={totalPaid > 0 ? totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
          sub={paidLabel}
        />
        <StatCard
          title="Taux d'approbation"
          value={approvalRate == null ? '—' : `${approvalRate}%`}
          sub={approvalRate == null ? 'aucune décision' : `${paidCount} payée${paidCount > 1 ? 's' : ''} · ${rejectedCount} rejetée${rejectedCount > 1 ? 's' : ''}`}
          tone={approvalRate != null && approvalRate >= 70 ? 'good' : 'default'}
        />
        <StatCard
          title="Délai moyen"
          value={procDisplay}
          sub="création → paiement"
        />
        <StatCard
          title="En attente"
          value={pipelineActiveCount}
          sub="pipeline actif"
        />
        <StatCard
          title="Anomalies"
          value={anomaliesTotal}
          sub="à traiter"
          tone={anomaliesTotal > 0 ? 'warn' : 'default'}
        />
      </div>

      {/* Donuts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DonutCard title="Pipeline actif" segments={pipelineSegments} />
        <DonutCard title="Résultats terminaux" segments={outcomeSegments} />
        <DonutCard title="Anomalies" segments={anomalySegments} />
      </div>

      {/* Volume + reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <VolumeChart days={days} />
        </div>
        <HBarsCard title="Top motifs" items={topReasons} valueKey="count" labelKey="label" />
      </div>

      {/* Currency + payment method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <CurrencyCard items={currencyBreakdown} />
        <HBarsCard title="Méthode de paiement" items={paymentBreakdown} valueKey="count" labelKey="label" />
      </div>

      {/* Activity feed */}
      <ActivityCard items={recentActivity} />
    </div>
  );
}
