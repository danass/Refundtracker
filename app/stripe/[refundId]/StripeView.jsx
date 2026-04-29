'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, Home, CreditCard, Users, FileText, Settings, BarChart3, Zap, ArrowDownLeft, MoreHorizontal, ExternalLink, Copy, CheckCircle2, Loader2, ArrowRight, Clock, AlertTriangle, Code } from 'lucide-react';

const STRIPE_PURPLE = '#635bff';
const STRIPE_DARK = '#0a2540';

function StripePill({ status }) {
  const styles = {
    succeeded: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Réussi' },
    pending:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500',   label: 'En cours' },
    processing:{ bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    label: 'En traitement' },
    failed:    { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500',     label: 'Échec' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'processing' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}

export default function StripeView({ refund }) {
  // Local state to drive the "process refund" animation
  const [phase, setPhase] = useState('idle'); // idle | processing | succeeded
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (phase !== 'processing') return;
    const start = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 200);
    const t = setTimeout(() => { setPhase('succeeded'); clearInterval(iv); }, 3500);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, [phase]);

  const sym = refund.currency === 'EUR' ? '€' : refund.currency === 'USD' ? '$' : '£';
  const amount = refund.amount?.toFixed(2);
  const refundId = `re_${refund.id.replace(/-/g, '').slice(0, 24)}`;
  const chargeId = `ch_${refund.id.replace(/-/g, '').slice(0, 24)}`;
  const piId = `pi_${refund.id.replace(/-/g, '').slice(0, 24)}`;
  const customerId = `cus_${refund.id.replace(/-/g, '').slice(0, 14)}`;

  const created = new Date(refund.createdAt);
  const stripeStatus = refund.status === 'PAID' ? 'succeeded'
    : refund.status === 'PAYMENT_PROCESSING' ? 'processing'
    : refund.status === 'APPROVED_FOR_PAYMENT' ? 'pending'
    : phase === 'succeeded' ? 'succeeded'
    : phase === 'processing' ? 'processing'
    : 'pending';

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif', fontSize: 14 }}>

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r shrink-0" style={{ borderColor: '#e3e8ee' }}>
        <div className="px-4 py-4 border-b flex items-center gap-2" style={{ borderColor: '#e3e8ee' }}>
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: STRIPE_PURPLE }}>
            <span className="text-white text-sm font-bold italic">S</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-900 leading-none">Clear SAS</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Mode test</p>
          </div>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
        <nav className="py-2 text-[13px]">
          {[
            { icon: Home, label: 'Accueil' },
            { icon: BarChart3, label: 'Paiements' },
            { icon: ArrowDownLeft, label: 'Remboursements', active: true },
            { icon: Users, label: 'Clients' },
            { icon: FileText, label: 'Factures' },
            { icon: Zap, label: 'Connect' },
            { icon: Code, label: 'Développeurs' },
            { icon: Settings, label: 'Paramètres' },
          ].map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={`flex items-center gap-2.5 px-4 py-1.5 cursor-pointer transition-colors ${active ? 'bg-[#f0eeff] text-[' + STRIPE_PURPLE + ']' : 'text-gray-700 hover:bg-gray-50'}`}
              style={active ? { color: STRIPE_PURPLE, borderRight: `2px solid ${STRIPE_PURPLE}` } : {}}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[13px] font-medium">{label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="bg-white border-b px-6 py-3 flex items-center gap-4" style={{ borderColor: '#e3e8ee' }}>
          <div className="flex-1 max-w-md flex items-center gap-2 bg-[#f6f9fc] px-3 py-1.5 rounded-md">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input className="bg-transparent outline-none text-xs flex-1 placeholder-gray-400" placeholder="Rechercher un paiement, client, facture…" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold border" style={{ borderColor: '#ffd166', background: '#fff8e1', color: '#b35900' }}>MODE TEST</span>
            <Bell className="w-4 h-4 text-gray-500" />
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: STRIPE_PURPLE }}>
              <span className="text-white text-[10px] font-bold">IR</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
            <span className="cursor-pointer hover:text-gray-700">Remboursements</span>
            <span>/</span>
            <span className="text-gray-600 font-mono">{refundId}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{sym}{amount}</h1>
                <span className="text-base text-gray-400">{refund.currency}</span>
                <StripePill status={stripeStatus} />
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Remboursement vers {refund.clientFirstName} {refund.clientLastName}</span>
                <span>·</span>
                <span className="font-mono flex items-center gap-1 cursor-pointer hover:text-gray-700">
                  {refundId}
                  <Copy className="w-3 h-3" />
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {phase === 'idle' && stripeStatus !== 'succeeded' && (
                <button
                  onClick={() => setPhase('processing')}
                  className="px-4 py-2 rounded-md text-white text-xs font-semibold shadow-sm transition-all hover:shadow-md flex items-center gap-1.5"
                  style={{ background: STRIPE_PURPLE }}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Initier le virement
                </button>
              )}
              {phase === 'processing' && (
                <div className="px-4 py-2 rounded-md text-white text-xs font-semibold flex items-center gap-2" style={{ background: STRIPE_PURPLE }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Traitement en cours… {elapsed}s
                </div>
              )}
              {phase === 'succeeded' && (
                <div className="px-4 py-2 rounded-md text-white text-xs font-semibold flex items-center gap-1.5 bg-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Virement émis
                </div>
              )}
              <button className="w-8 h-8 border rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors" style={{ borderColor: '#e3e8ee' }}>
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Processing animation panel */}
          {phase === 'processing' && (
            <div className="bg-white rounded-lg border mb-6 p-6" style={{ borderColor: '#e3e8ee' }}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Pipeline de traitement</p>
              <div className="space-y-3">
                <ProcessStep done time="0s" label="Demande reçue par Stripe" />
                <ProcessStep done={elapsed >= 1} active={elapsed === 0} time="0.4s" label="Validation du compte bénéficiaire" />
                <ProcessStep done={elapsed >= 2} active={elapsed === 1} time="1.1s" label="Vérification anti-fraude" />
                <ProcessStep done={elapsed >= 3} active={elapsed === 2} time="2.3s" label="Routage vers la banque (SEPA)" />
                <ProcessStep done={elapsed >= 4} active={elapsed === 3} time="3.4s" label="Confirmation de l'instruction de virement" />
              </div>
            </div>
          )}

          {/* Success panel */}
          {phase === 'succeeded' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 mb-6 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Virement initié avec succès</p>
                <p className="text-xs text-emerald-700 mt-1 leading-5">
                  L'instruction SEPA a été envoyée à la banque émettrice. Le bénéficiaire recevra le virement sous 1 à 2 jours ouvrés.
                  Une notification webhook a été envoyée à votre application.
                </p>
              </div>
            </div>
          )}

          {/* Detail grid */}
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 space-y-5">

              {/* Timeline */}
              <Section title="Chronologie">
                <div className="space-y-0">
                  <TimelineRow time={created.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} label="Demande de remboursement créée" desc={`Approuvée par Reflow · ${refund.ticketId}`} done />
                  {(stripeStatus === 'processing' || stripeStatus === 'succeeded' || phase === 'processing' || phase === 'succeeded') && (
                    <TimelineRow time={new Date(created.getTime() + 60000).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} label="Virement initié" desc="SEPA Credit Transfer · Bénéficiaire vérifié" done active={phase === 'processing'} />
                  )}
                  {(stripeStatus === 'succeeded' || phase === 'succeeded') && (
                    <TimelineRow time={new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} label="Virement confirmé" desc="Instruction transmise à la banque" done success />
                  )}
                  {(stripeStatus === 'pending' && phase === 'idle') && (
                    <TimelineRow time="—" label="En attente d'initiation" desc="Cliquez sur 'Initier le virement'" />
                  )}
                </div>
              </Section>

              {/* Payment method */}
              <Section title="Moyen de paiement bénéficiaire">
                <div className="flex items-center gap-3 p-3 rounded-md border" style={{ borderColor: '#e3e8ee' }}>
                  <div className="w-10 h-7 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-[9px] font-bold tracking-wider">SEPA</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-700">
                      {refund.iban ? `${refund.iban.slice(0, 4)} •••• •••• •••• ${refund.iban.slice(-4)}` : 'IBAN manquant'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {refund.bankName || 'Banque non spécifiée'} · {refund.bic || 'BIC manquant'}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                    Vérifié
                  </span>
                </div>
              </Section>

              {/* Risk insights */}
              <Section title="Évaluation des risques">
                <div className="grid grid-cols-3 gap-2">
                  <RiskBox label="Score Radar" value={refund.isFlagged ? '64 / 100' : '12 / 100'} tone={refund.isFlagged ? 'amber' : 'green'} />
                  <RiskBox label="Vérification CIB" value="Validée" tone="green" />
                  <RiskBox label="Anti-blanchiment" value="OK" tone="green" />
                </div>
                {refund.isFlagged && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Règle Radar déclenchée</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">{refund.riskTriggers || 'Vérification manuelle recommandée.'}</p>
                    </div>
                  </div>
                )}
              </Section>

              {/* Webhooks/events */}
              <Section title="Événements & webhooks">
                <div className="space-y-2 text-xs">
                  <EventRow type="charge.refund.updated" status="200" />
                  {(stripeStatus === 'succeeded' || phase === 'succeeded') && <EventRow type="charge.refunded" status="200" />}
                  <EventRow type="refund.created" status="200" />
                </div>
              </Section>

            </div>

            {/* Right rail */}
            <div className="space-y-5">
              <Section title="Métadonnées" compact>
                <Meta label="Montant" value={`${sym}${amount} ${refund.currency}`} />
                <Meta label="Frais Stripe" value={`${sym}0,00 (gratuit)`} />
                <Meta label="Net" value={`${sym}${amount} ${refund.currency}`} />
                <Meta label="Devise" value={refund.currency} />
                <Meta label="Type" value="Refund" />
                <Meta label="Méthode" value="SEPA Credit Transfer" />
              </Section>

              <Section title="Identifiants" compact>
                <Meta label="Refund ID" value={refundId} mono />
                <Meta label="Charge ID" value={chargeId} mono />
                <Meta label="PaymentIntent" value={piId} mono />
                <Meta label="Customer" value={customerId} mono />
              </Section>

              <Section title="Bénéficiaire" compact>
                <Meta label="Nom" value={`${refund.clientFirstName} ${refund.clientLastName}`} />
                <Meta label="Email" value={refund.clientEmail} />
                <Meta label="Pays" value="🇫🇷 France" />
              </Section>

              <Section title="Liens" compact>
                <a className="flex items-center gap-2 text-xs hover:underline cursor-pointer" style={{ color: STRIPE_PURPLE }}>
                  Reçu PDF <ExternalLink className="w-3 h-3" />
                </a>
                <a className="flex items-center gap-2 text-xs hover:underline cursor-pointer mt-1.5" style={{ color: STRIPE_PURPLE }}>
                  Voir dans Reflow <ExternalLink className="w-3 h-3" />
                </a>
                <a className="flex items-center gap-2 text-xs hover:underline cursor-pointer mt-1.5" style={{ color: STRIPE_PURPLE }}>
                  Logs API <ExternalLink className="w-3 h-3" />
                </a>
              </Section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({ title, children, compact }) {
  return (
    <div className="bg-white rounded-lg border" style={{ borderColor: '#e3e8ee' }}>
      <div className={`${compact ? 'px-4 py-2.5' : 'px-5 py-3'} border-b`} style={{ borderColor: '#e3e8ee' }}>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <div className={compact ? 'px-4 py-3 space-y-2' : 'px-5 py-4'}>
        {children}
      </div>
    </div>
  );
}

function Meta({ label, value, mono }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[11px] text-gray-400 w-20 shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs flex-1 break-all ${mono ? 'font-mono text-gray-700' : 'text-gray-700'}`}>{value}</span>
    </div>
  );
}

function ProcessStep({ done, active, time, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        done ? 'bg-emerald-500' : active ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-100'
      }`}>
        {done ? <CheckCircle2 className="w-3 h-3 text-white" />
        : active ? <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
        : <Clock className="w-2.5 h-2.5 text-gray-300" />}
      </div>
      <span className="text-[11px] font-mono text-gray-400 w-10 shrink-0">{time}</span>
      <span className={`text-xs ${done ? 'text-gray-700' : active ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

function TimelineRow({ time, label, desc, done, active, success }) {
  return (
    <div className="flex gap-3 py-2.5">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 ${
          success ? 'bg-emerald-500' : done ? 'bg-blue-500' : active ? 'bg-blue-400 ring-2 ring-blue-100 animate-pulse' : 'bg-gray-200'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900">{label}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
        <p className="text-[10px] text-gray-300 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function RiskBox({ label, value, tone }) {
  const tones = {
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-md border px-3 py-2.5 ${tones[tone] || tones.green}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}

function EventRow({ type, status }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">{status}</span>
      <span className="font-mono text-[11px] text-gray-700">{type}</span>
      <span className="ml-auto text-[10px] text-gray-400">il y a quelques secondes</span>
    </div>
  );
}
