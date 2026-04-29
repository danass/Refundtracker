'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, ExternalLink, User, Inbox, ShieldCheck, CreditCard, Receipt, CheckCircle2, ChevronRight, Play } from 'lucide-react';

// ── Scenario definitions ──────────────────────────────────────────────

function buildScenarios(ids) {
  return [
    {
      id: 'client-flow',
      label: 'Parcours client',
      icon: User,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      description: 'Alice a contacté le support. Elle reçoit un email, fournit son IBAN, et suit l\'avancement de son remboursement.',
      steps: [
        {
          title: 'Alice reçoit un email de confirmation',
          description: 'Après avoir contacté le support, Alice reçoit un email lui confirmant que sa demande est enregistrée et qu\'un agent va la traiter.',
          role: 'client',
          links: [
            { label: 'Boîte mail d\'Alice', href: '/mail', icon: Receipt },
          ],
          highlight: 'L\'email arrive en quelques minutes. Alice n\'a encore rien à faire.',
        },
        {
          title: 'L\'agent lui demande son IBAN',
          description: 'L\'agent a pris en charge le dossier dans Reflow. Il voit que l\'IBAN est manquant et envoie une relance. Alice reçoit un email avec un lien direct.',
          role: 'client',
          links: [
            { label: 'Boîte mail d\'Alice', href: '/mail', icon: Receipt },
            ids.pending && { label: 'Espace client Alice', href: `/refunds/${ids.pending}?simulatedRole=client`, icon: User },
          ].filter(Boolean),
          highlight: 'Action requise : Alice doit renseigner son IBAN pour continuer.',
        },
        {
          title: 'Alice fournit son IBAN',
          description: 'Depuis son espace client, Alice remplit le formulaire IBAN. Le statut de sa demande passe automatiquement à "Informations fournies".',
          role: 'client',
          links: [
            ids.pending && { label: 'Formulaire IBAN', href: `/refunds/${ids.pending}?simulatedRole=client`, icon: User },
            ids.validated && { label: 'Vue avec IBAN fourni', href: `/refunds/${ids.validated}?simulatedRole=client`, icon: User },
          ].filter(Boolean),
          highlight: 'Dès la soumission, le stepper avance. Alice voit "Vérification en cours".',
        },
        {
          title: 'Alice suit l\'avancement',
          description: 'Alice peut revenir sur sa demande à tout moment. Le stepper lui montre exactement où en est son dossier et ce qui va se passer ensuite.',
          role: 'client',
          links: [
            ids.validated && { label: 'Vue "En cours de traitement"', href: `/refunds/${ids.validated}?simulatedRole=client`, icon: User },
            ids.paid && { label: 'Vue "Remboursé" (exemple)', href: `/refunds/${ids.paid}?simulatedRole=client`, icon: CheckCircle2 },
          ].filter(Boolean),
          highlight: 'Sentiment de contrôle et de transparence à chaque étape.',
        },
      ],
    },
    {
      id: 'agent-flow',
      label: 'Traitement agent',
      icon: Inbox,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      description: 'Marc reçoit un ticket Zendesk, le traite dans Reflow, vérifie les informations et valide ou escalade le remboursement.',
      steps: [
        {
          title: 'Un ticket arrive dans Zendesk',
          description: 'Le client a contacté le support. Un ticket Zendesk est créé automatiquement. Marc le voit dans sa file d\'attente.',
          role: 'agent',
          links: [
            ids.pendingZd && { label: `Ticket Zendesk ${ids.pendingZd}`, href: `/zendesk/${ids.pendingZd}`, icon: ExternalLink },
          ].filter(Boolean),
          highlight: 'Zendesk centralise la communication client. Reflow prend le relais pour le traitement financier.',
        },
        {
          title: 'Marc ouvre le dossier dans Reflow',
          description: 'Depuis Zendesk, Marc clique sur "Voir dans Reflow". Il arrive sur la fiche de la demande avec la checklist de traitement.',
          role: 'agent',
          links: [
            ids.pending && { label: 'Dossier en attente IBAN', href: `/refunds/${ids.pending}?simulatedRole=agent`, icon: Inbox },
            { label: 'File agent', href: '/agent?tab=waiting', icon: Inbox },
          ].filter(Boolean),
          highlight: 'La checklist signale immédiatement : IBAN manquant. Marc envoie une relance.',
        },
        {
          title: 'L\'IBAN est fourni — Marc traite le dossier',
          description: 'Alice a soumis son IBAN. La demande remonte dans l\'onglet "IBAN reçu" (fond vert). Marc peut maintenant approuver ou escalader.',
          role: 'agent',
          links: [
            ids.validated && { label: 'Dossier prêt à traiter', href: `/refunds/${ids.validated}?simulatedRole=agent`, icon: Inbox },
            { label: 'File "IBAN reçu"', href: '/agent?tab=ready', icon: Inbox },
          ].filter(Boolean),
          highlight: 'Si montant ≤ commande originale → Finance directement. Sinon → Responsable.',
        },
        {
          title: 'Marc approuve — le dossier part en validation',
          description: 'Marc clique "Approuver". Selon le montant, le dossier est envoyé au responsable ou directement à la finance.',
          role: 'agent',
          links: [
            ids.leadPending && { label: 'Dossier chez le responsable', href: `/refunds/${ids.leadPending}?simulatedRole=lead`, icon: ShieldCheck },
            { label: 'File responsable', href: '/lead', icon: ShieldCheck },
          ].filter(Boolean),
          highlight: 'L\'historique est tracé à chaque étape : qui a fait quoi, quand.',
        },
      ],
    },
    {
      id: 'lead-finance-flow',
      label: 'Validation & paiement',
      icon: ShieldCheck,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      description: 'Vanessa (responsable) valide le dossier, Éric (superviseur) approuve si montant élevé, Isabelle (finance) exécute le virement.',
      steps: [
        {
          title: 'Vanessa valide le dossier',
          description: 'Le responsable reçoit les dossiers approuvés par les agents. Elle vérifie le montant, les notes, et approuve ou rejette.',
          role: 'lead',
          links: [
            ids.leadPending && { label: 'Dossier à valider', href: `/refunds/${ids.leadPending}?simulatedRole=lead`, icon: ShieldCheck },
            { label: 'File responsable', href: '/lead', icon: ShieldCheck },
          ].filter(Boolean),
          highlight: 'Les dossiers > 1 500 € passent par le superviseur avant la finance.',
        },
        {
          title: 'Éric approuve (montants élevés)',
          description: 'Pour les dossiers dépassant le seuil, Éric (superviseur) donne l\'approbation finale avant que la finance exécute le paiement.',
          role: 'supervisor',
          links: [
            { label: 'File superviseur', href: '/supervisor', icon: ShieldCheck },
          ],
          highlight: 'Double contrôle sur les montants sensibles — traçabilité complète.',
        },
        {
          title: 'Isabelle déclenche le virement',
          description: 'La finance voit les dossiers approuvés. Isabelle initie le paiement et confirme l\'exécution du virement.',
          role: 'finance',
          links: [
            { label: 'File finance', href: '/finance', icon: CreditCard },
            ids.paid && { label: 'Exemple dossier payé', href: `/refunds/${ids.paid}?simulatedRole=finance`, icon: CreditCard },
          ].filter(Boolean),
          highlight: 'À la confirmation, le statut passe à "Remboursé" et Alice reçoit un email.',
        },
        {
          title: 'Alice reçoit la confirmation',
          description: 'Le virement est confirmé. Alice reçoit un email avec la référence. Son espace client affiche la carte de succès.',
          role: 'client',
          links: [
            { label: 'Boîte mail Alice', href: '/mail', icon: Receipt },
            ids.paid && { label: 'Espace client — Remboursé', href: `/refunds/${ids.paid}?simulatedRole=client`, icon: User },
          ].filter(Boolean),
          highlight: '🎉 Sentiment de relief — dossier terminé, virement effectué.',
        },
      ],
    },
    {
      id: 'flagged-flow',
      label: 'Dossier signalé',
      icon: ShieldCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      description: 'Certaines demandes déclenchent un signalement automatique (montant élevé, nom différent). L\'agent doit investiguer.',
      steps: [
        {
          title: 'Un dossier est automatiquement signalé',
          description: 'Dès la création, si le montant dépasse 2 000 € ou si le nom du bénéficiaire ne correspond pas au paiement original, la demande est marquée ⚠.',
          role: 'agent',
          links: [
            ids.flagged && { label: 'Dossier signalé', href: `/refunds/${ids.flagged}?simulatedRole=agent`, icon: Inbox },
            { label: 'File "Signalées"', href: '/agent?tab=flagged', icon: Inbox },
          ].filter(Boolean),
          highlight: 'Bannière amber en haut du dossier avec les triggers détectés.',
        },
        {
          title: 'L\'agent vérifie la checklist',
          description: 'La checklist de traitement détaille chaque anomalie : nom différent, montant supérieur, flag manuel. L\'agent peut approuver, escalader ou rejeter.',
          role: 'agent',
          links: [
            ids.flagged && { label: 'Checklist du dossier signalé', href: `/refunds/${ids.flagged}?simulatedRole=agent`, icon: Inbox },
          ].filter(Boolean),
          highlight: 'Décision éclairée — toutes les données de comparaison sont visibles.',
        },
        {
          title: 'Escalade au superviseur si nécessaire',
          description: 'En cas de doute, l\'agent escalade directement au superviseur. Toutes les actions sont tracées dans l\'historique.',
          role: 'supervisor',
          links: [
            { label: 'File superviseur', href: '/supervisor', icon: ShieldCheck },
          ],
          highlight: 'Audit trail complet : qui a décidé quoi et pourquoi.',
        },
      ],
    },
  ];
}

const ROLE_COLORS = {
  client:     { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Client' },
  agent:      { bg: 'bg-sky-100',  text: 'text-sky-700',  label: 'Agent' },
  lead:       { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Responsable' },
  supervisor: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Superviseur' },
  finance:    { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Finance' },
};

// ── Component ──────────────────────────────────────────────────────────

export default function DemoWalkthrough({ ids }) {
  const scenarios = buildScenarios(ids);
  const [activeScenario, setActiveScenario] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const scenario = scenarios[activeScenario];
  const step = scenario.steps[activeStep];
  const role = ROLE_COLORS[step.role] || ROLE_COLORS.agent;
  const ScenarioIcon = scenario.icon;

  const goNext = () => {
    if (activeStep < scenario.steps.length - 1) setActiveStep(s => s + 1);
    else if (activeScenario < scenarios.length - 1) { setActiveScenario(s => s + 1); setActiveStep(0); }
  };
  const goPrev = () => {
    if (activeStep > 0) setActiveStep(s => s - 1);
    else if (activeScenario > 0) { setActiveScenario(s => s - 1); setActiveStep(scenarios[activeScenario - 1].steps.length - 1); }
  };

  const canNext = activeStep < scenario.steps.length - 1 || activeScenario < scenarios.length - 1;
  const canPrev = activeStep > 0 || activeScenario > 0;

  return (
    <div className="min-h-screen" style={{ background: 'hsl(220,20%,97%)' }}>

      {/* Header */}
      <div className="bg-white border-b px-6 py-4" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Mode démo</h1>
              <p className="text-xs text-gray-400">Reflow — guide interactif</p>
            </div>
          </div>
          <Link href="/overview" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            ← Retour à l'app
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Scenario selector */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Scénarios</p>
          {scenarios.map((s, i) => {
            const SIcon = s.icon;
            const isActive = i === activeScenario;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveScenario(i); setActiveStep(0); }}
                className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl border transition-all ${isActive ? `${s.bg} ${s.border}` : 'bg-white border-transparent hover:border-gray-200'}`}
                style={{ borderColor: isActive ? undefined : 'hsl(220,13%,89%)' }}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isActive ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                  <SIcon className={`w-3.5 h-3.5 ${isActive ? s.color : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{s.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-4">{s.description.slice(0, 60)}…</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main step view */}
        <div className="lg:col-span-3 space-y-4">
          {/* Scenario title */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${scenario.bg} ${scenario.border}`}>
            <ScenarioIcon className={`w-4 h-4 shrink-0 ${scenario.color}`} />
            <div>
              <p className="text-sm font-bold text-gray-900">{scenario.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{scenario.description}</p>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2">
            {scenario.steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className="flex items-center gap-1.5 group"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  i < activeStep ? 'bg-emerald-500 text-white'
                  : i === activeStep ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}>
                  {i < activeStep ? '✓' : i + 1}
                </div>
                {i < scenario.steps.length - 1 && (
                  <div className={`w-6 h-0.5 ${i < activeStep ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                )}
              </button>
            ))}
            <span className="ml-2 text-xs text-gray-400">Étape {activeStep + 1} / {scenario.steps.length}</span>
          </div>

          {/* Step card */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            {/* Role badge */}
            <div className="px-6 pt-5 pb-0 flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${role.bg} ${role.text}`}>
                {role.label}
              </span>
              <span className="text-xs text-gray-400">est en train de…</span>
            </div>

            <div className="px-6 pt-3 pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h2>
              <p className="text-sm text-gray-600 leading-6 mb-5">{step.description}</p>

              {/* Highlight */}
              <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-100 rounded-xl mb-5">
                <span className="text-base shrink-0">💡</span>
                <p className="text-sm text-blue-800 font-medium">{step.highlight}</p>
              </div>

              {/* Action links */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Voir dans l'app</p>
                {step.links.map((link, i) => {
                  const LinkIcon = link.icon || ChevronRight;
                  return (
                    <Link
                      key={i}
                      href={link.href}
                      target={link.href.startsWith('/zendesk') || link.href.startsWith('/mail') ? '_blank' : undefined}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-blue-50 border hover:border-blue-200 rounded-xl transition-all group"
                      style={{ borderColor: 'hsl(220,13%,89%)' }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center shrink-0 group-hover:border-blue-200 transition-colors" style={{ borderColor: 'hsl(220,13%,89%)' }}>
                        <LinkIcon className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 flex-1 transition-colors">{link.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={!canPrev}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ borderColor: 'hsl(220,13%,89%)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </button>

            <div className="flex gap-1.5">
              {scenarios.map((s, si) =>
                s.steps.map((_, sti) => {
                  const isActive = si === activeScenario && sti === activeStep;
                  const isDone = si < activeScenario || (si === activeScenario && sti < activeStep);
                  return (
                    <button
                      key={`${si}-${sti}`}
                      onClick={() => { setActiveScenario(si); setActiveStep(sti); }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-blue-600 w-4' : isDone ? 'bg-emerald-400' : 'bg-gray-200'}`}
                    />
                  );
                })
              )}
            </div>

            <button
              onClick={goNext}
              disabled={!canNext}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {activeStep < scenario.steps.length - 1 ? 'Étape suivante' : 'Scénario suivant'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
