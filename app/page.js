import Link from 'next/link';
import Logo from './components/Logo';
import LandingShowcase from './components/LandingShowcase';
import {
  ArrowRight, Play, ShieldCheck, GitBranch, Mail, CreditCard,
  Eye, BarChart3, Sparkles, ChevronRight,
} from 'lucide-react';

export const metadata = {
  title: 'Reflow — Pilotez vos remboursements de bout en bout',
  description: 'De Zendesk au virement Stripe, Reflow orchestre chaque demande de remboursement avec transparence pour vos clients et vos équipes.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Top nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b" style={{ borderColor: 'hsl(220,13%,93%)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Logo size={32} withWordmark />
          <nav className="hidden md:flex items-center gap-8 ml-12 text-sm text-gray-600">
            <a href="#showcase" className="hover:text-gray-900 transition-colors">Aperçu</a>
            <a href="#fonctionnalites" className="hover:text-gray-900 transition-colors">Fonctionnalités</a>
            <a href="#workflow" className="hover:text-gray-900 transition-colors">Comment ça marche</a>
            <a href="#integrations" className="hover:text-gray-900 transition-colors">Intégrations</a>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Se connecter
            </Link>
            <Link
              href="/presentation"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Play className="w-3 h-3 fill-white" />
              Voir la démo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -top-20 right-0 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-40" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white/80 backdrop-blur text-xs font-semibold text-gray-600 mb-8" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            <Sparkles className="w-3 h-3 text-blue-500" />
            Nouveau · Intégration Stripe SEPA native
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Pilotez vos remboursements
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              de bout en bout.
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-7">
            De Zendesk au virement bancaire, Reflow orchestre chaque demande avec transparence,
            traçabilité et empathie — pour vos clients comme pour vos équipes.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/presentation"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-all shadow-sm hover:shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Lancer la démo guidée
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              style={{ borderColor: 'hsl(220,13%,89%)' }}
            >
              Accéder à l'application
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Aucune carte requise · Données fictives pour la démo
          </p>

          {/* Hero mockup */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="rounded-2xl border bg-white shadow-2xl overflow-hidden" style={{ borderColor: 'hsl(220,13%,89%)' }}>
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                </div>
                <div className="ml-4 flex-1 max-w-sm bg-white rounded-md px-2.5 py-1 text-xs text-gray-400 border" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                  reflow.app/agent
                </div>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4 bg-gray-50">
                <MockKpi label="En attente IBAN" value="14" tone="amber" />
                <MockKpi label="IBAN reçu" value="9" tone="emerald" />
                <MockKpi label="Signalées" value="3" tone="red" />
                <div className="col-span-3 bg-white rounded-xl border p-4 space-y-2" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                  <MockRow name="Alice Wonder" amount="€159,99" status="IBAN reçu" tone="emerald" />
                  <MockRow name="Lucas Bernard" amount="€89,50" status="En attente IBAN" tone="amber" />
                  <MockRow name="Sophie Martin" amount="€2 340,00" status="Signalée" tone="red" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y bg-gray-50/50" style={{ borderColor: 'hsl(220,13%,93%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <Stat value="–73%" label="de temps de traitement" />
          <Stat value="100%" label="d'audit trail" />
          <Stat value="3 min" label="de Zendesk au virement" />
          <Stat value="5★" label="satisfaction client" />
        </div>
      </section>

      {/* Showcase — dynamic mockup of every key view */}
      <LandingShowcase />

      {/* Features */}
      <section id="fonctionnalites" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Fonctionnalités</p>
          <h2 className="text-4xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
            Une orchestration pensée pour chaque rôle.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Feature icon={GitBranch} color="text-blue-600 bg-blue-50" title="Pipeline multi-rôles"
            desc="Agent → Responsable → Superviseur → Finance. Chaque étape est validée par la bonne personne, automatiquement." />
          <Feature icon={Eye} color="text-violet-600 bg-violet-50" title="Traçabilité totale"
            desc="Audit trail horodaté à chaque action. Plus jamais de doute sur qui a fait quoi et quand." />
          <Feature icon={ShieldCheck} color="text-emerald-600 bg-emerald-50" title="Détection d'anomalies"
            desc="Montants élevés, noms qui ne matchent pas, paiements suspects. Reflow signale, vous décidez." />
          <Feature icon={Mail} color="text-rose-600 bg-rose-50" title="Communication client"
            desc="Emails automatiques à chaque étape. Le client suit l'avancement en temps réel sur son espace." />
          <Feature icon={CreditCard} color="text-indigo-600 bg-indigo-50" title="Paiements Stripe natifs"
            desc="Virement SEPA en un clic depuis Reflow. Zéro double saisie, frais Stripe à zéro pour les remboursements." />
          <Feature icon={BarChart3} color="text-amber-600 bg-amber-50" title="Tableau de bord temps réel"
            desc="Volume traité, montants remboursés, anomalies détectées. Une vue d'ensemble pour vos équipes finance." />
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="bg-gray-50 border-y" style={{ borderColor: 'hsl(220,13%,93%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Comment ça marche</p>
            <h2 className="text-4xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
              5 étapes du ticket au virement.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-10">
            <WorkflowStep n="1" title="Demande client" desc="Le client signale un problème depuis le site marchand ou contacte le support." color="bg-rose-500" />
            <WorkflowStep n="2" title="Ticket Zendesk" desc="L'équipe support qualifie la demande et la déclare dans Reflow en un clic." color="bg-sky-500" />
            <WorkflowStep n="3" title="Traitement Reflow" desc="Vérifications, IBAN, escalade si nécessaire. Tout est tracé." color="bg-amber-500" />
            <WorkflowStep n="4" title="Validation interne" desc="Responsable et superviseur approuvent selon les seuils définis." color="bg-violet-500" />
            <WorkflowStep n="5" title="Virement Stripe" desc="L'équipe finance déclenche le SEPA. Le client est notifié à la confirmation." color="bg-emerald-500" />
          </div>

          <div className="text-center">
            <Link
              href="/presentation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Voir le scénario complet
            </Link>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Intégrations</p>
          <h2 className="text-4xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
            S'intègre dans votre stack existante.
          </h2>
          <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto">
            Reflow ne remplace pas vos outils, il les connecte. Pas de migration, pas de double saisie.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <IntegrationCard name="Zendesk" tag="Tickets support" color="#1f73b7" />
          <IntegrationCard name="Stripe" tag="Paiements SEPA" color="#635bff" />
          <IntegrationCard name="Slack" tag="Notifications" color="#4a154b" />
          <IntegrationCard name="API REST" tag="Connectez vos outils" color="#0a2540" />
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Prêt à transformer<br/>vos remboursements ?
          </h2>
          <p className="mt-5 text-lg text-blue-100 max-w-xl mx-auto">
            Lancez la démo guidée et suivez Alice, du clic "Demander un remboursement" jusqu'au virement Stripe.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/presentation"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-900 text-sm font-bold hover:bg-blue-50 transition-colors shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Lancer la démo
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/40 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Connexion équipe
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'hsl(220,13%,93%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={24} withWordmark />
            <span className="text-xs text-gray-400 ml-2">© 2026 · Tous droits réservés</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-500">
            <a className="hover:text-gray-900 cursor-pointer">Confidentialité</a>
            <a className="hover:text-gray-900 cursor-pointer">Conditions</a>
            <a className="hover:text-gray-900 cursor-pointer">Sécurité</a>
            <Link href="/contact" className="hover:text-gray-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function MockKpi({ label, value, tone }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    red: 'border-red-200 bg-red-50',
  };
  return (
    <div className={`bg-white rounded-xl border p-3 ${tones[tone] || ''}`}>
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function MockRow({ name, amount, status, tone }) {
  const tones = {
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
        {name.split(' ').map(p => p[0]).join('').slice(0, 2)}
      </div>
      <span className="text-xs font-medium text-gray-700 flex-1 text-left">{name}</span>
      <span className="text-xs font-bold text-gray-700 mr-2">{amount}</span>
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${tones[tone]}`}>{status}</span>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function Feature({ icon: Icon, color, title, desc }) {
  return (
    <div className="rounded-2xl border p-6 bg-white hover:shadow-md transition-all" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="mt-4 text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-sm text-gray-500 leading-6">{desc}</p>
    </div>
  );
}

function WorkflowStep({ n, title, desc, color }) {
  return (
    <div className="bg-white rounded-2xl border p-5 relative" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold ${color}`}>{n}</div>
      <h3 className="mt-4 text-sm font-bold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-xs text-gray-500 leading-5">{desc}</p>
    </div>
  );
}

function IntegrationCard({ name, tag, color }) {
  return (
    <div className="rounded-2xl border bg-white p-6 text-center hover:shadow-md transition-all" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-white text-lg font-bold" style={{ background: color }}>
        {name[0]}
      </div>
      <p className="mt-4 text-sm font-bold text-gray-900">{name}</p>
      <p className="mt-1 text-[11px] text-gray-400">{tag}</p>
    </div>
  );
}
