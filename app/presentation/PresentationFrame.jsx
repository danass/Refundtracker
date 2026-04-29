'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, X, Maximize2, Play, RefreshCw, Loader2, KeyRound } from 'lucide-react';
import Logo from '../components/Logo';

const QUICK_LOGINS = [
  { label: 'Agent',       color: 'bg-sky-500' },
  { label: 'Responsable', color: 'bg-amber-500' },
  { label: 'Superviseur', color: 'bg-violet-500' },
  { label: 'Finance',     color: 'bg-emerald-500' },
  { label: 'Client',      color: 'bg-rose-500' },
];

// ── Slide definitions ──────────────────────────────────────────────────
//
// All slides reference the SAME Alice refund (ids.refundId / ids.zendeskId).
// `targetStatus` (when set) makes the presentation advance the refund's
// status server-side before showing the slide, so the same dossier
// progresses through the pipeline as we navigate.

function buildSlides({ refundId, ticketId, zendeskId }) {
  const ref = refundId || '';
  const zd = zendeskId || ticketId || 'ZD-DEMO';

  return [
    // ─── Acte I : Le client a un problème ───
    {
      title: 'Alice a acheté un casque audio défectueux',
      subtitle: 'Elle se rend sur son compte SoundWave pour signaler le problème et demander un remboursement.',
      role: { id: 'shopper', label: 'Cliente', name: 'Alice Wonder', initials: 'AW', color: 'bg-violet-500' },
      url: '/shop',
      tip: 'Le client clique sur "Demander un remboursement" depuis le détail de sa commande.',
      act: 'Acte 1 — Le problème',
    },

    // ─── Acte II : Réception interne ───
    {
      title: 'Un ticket Zendesk est créé automatiquement',
      subtitle: 'La demande arrive immédiatement chez l\'équipe Support sous forme de ticket Zendesk.',
      role: { id: 'agent', label: 'Agent Support', name: 'Marc Lefèvre', initials: 'ML', color: 'bg-sky-500' },
      url: `/zendesk/${zd}`,
      tip: 'Marc voit la conversation client et toutes les informations de la commande.',
      act: 'Acte 2 — Réception du ticket',
    },
    {
      title: 'Marc clique sur "Déclarer dans Reflow"',
      subtitle: 'Depuis Zendesk, un seul bouton crée le dossier financier dans Reflow via API.',
      role: { id: 'agent', label: 'Agent Support', name: 'Marc Lefèvre', initials: 'ML', color: 'bg-sky-500' },
      url: `/zendesk/${zd}`,
      tip: 'Animation 4 étapes : extraction → validation → POST API → sync identifiants.',
      act: 'Acte 2 — Création dans Reflow',
      targetStatus: 'PENDING_AGENT_REVIEW',
    },
    {
      title: 'Marc se connecte à Reflow',
      subtitle: 'Authentification rapide depuis l\'écran de connexion. Quick-fill "Agent" pour la démo.',
      role: { id: 'agent', label: 'Agent Support', name: 'Marc Lefèvre', initials: 'ML', color: 'bg-sky-500' },
      url: '/login',
      tip: 'Cliquez sur le bouton "Agent" pour pré-remplir les identifiants et vous connecter.',
      act: 'Acte 2 — Connexion à Reflow',
    },
    {
      title: 'Vue d\'ensemble — toutes les demandes en cours',
      subtitle: 'Marc consulte le dashboard global : volume, anomalies, répartition par statut.',
      role: { id: 'agent', label: 'Agent Support', name: 'Marc Lefèvre', initials: 'ML', color: 'bg-sky-500' },
      url: '/overview',
      tip: 'Vision panoramique pour identifier les goulots d\'étranglement.',
      act: 'Acte 2 — Dashboard',
    },
    {
      title: 'File "En attente IBAN"',
      subtitle: 'Marc filtre les demandes où le client doit encore fournir ses coordonnées bancaires.',
      role: { id: 'agent', label: 'Agent Support', name: 'Marc Lefèvre', initials: 'ML', color: 'bg-sky-500' },
      url: '/agent?tab=waiting',
      tip: 'Le dossier d\'Alice est dans la liste — IBAN manquant.',
      act: 'Acte 2 — File de traitement',
    },
    {
      title: 'Détail du dossier d\'Alice',
      subtitle: 'Marc ouvre la fiche : checklist de vérification, anomalies détectées, actions disponibles.',
      role: { id: 'agent', label: 'Agent Support', name: 'Marc Lefèvre', initials: 'ML', color: 'bg-sky-500' },
      url: ref ? `/refunds/${ref}?simulatedRole=agent` : '/agent',
      tip: 'Le checklist signale "IBAN manquant". Marc envoie une relance au client.',
      act: 'Acte 2 — Vérification',
    },

    // ─── Acte III : Côté client — communication ───
    {
      title: 'Alice reçoit l\'email de demande d\'IBAN',
      subtitle: 'Notification immédiate dans sa boîte mail, avec lien direct vers son espace de suivi.',
      role: { id: 'client', label: 'Cliente', name: 'Alice Wonder', initials: 'AW', color: 'bg-rose-500' },
      url: '/mail',
      tip: 'Email "Action requise" stylé Gmail. Bouton CTA pour fournir l\'IBAN.',
      act: 'Acte 3 — Notification client',
    },
    {
      title: 'Espace client d\'Alice — IBAN à fournir',
      subtitle: 'Alice arrive sur son espace : statut clair, stepper de progression, formulaire IBAN proéminent.',
      role: { id: 'client', label: 'Cliente', name: 'Alice Wonder', initials: 'AW', color: 'bg-rose-500' },
      url: ref ? `/refunds/${ref}?simulatedRole=client` : '/client',
      tip: 'Empathique, rassurant. Alice comprend où elle en est et ce qu\'on attend d\'elle.',
      act: 'Acte 3 — Action client',
    },
    {
      title: 'Alice fournit son IBAN',
      subtitle: 'Le formulaire est validé instantanément. Le statut passe à "Informations fournies".',
      role: { id: 'client', label: 'Cliente', name: 'Alice Wonder', initials: 'AW', color: 'bg-rose-500' },
      url: ref ? `/refunds/${ref}?simulatedRole=client` : '/client',
      tip: 'Le stepper avance — Alice voit "Vérification en cours". IBAN affiché masqué.',
      act: 'Acte 3 — Soumission',
      targetStatus: 'CLIENT_VALIDATED',
    },

    // ─── Acte IV : Traitement interne ───
    {
      title: 'Marc voit que l\'IBAN est arrivé',
      subtitle: 'Le dossier remonte dans la file "IBAN reçu" — fond vert. Marc peut maintenant le traiter.',
      role: { id: 'agent', label: 'Agent Support', name: 'Marc Lefèvre', initials: 'ML', color: 'bg-sky-500' },
      url: '/agent?tab=ready',
      tip: 'Onglet "IBAN reçu" avec compteur. Lignes vertes = prêtes à approuver.',
      act: 'Acte 4 — Traitement',
    },
    {
      title: 'Marc approuve et escalade au responsable',
      subtitle: 'Marc valide le dossier. Le montant est suffisant pour passer par le responsable avant la finance.',
      role: { id: 'agent', label: 'Agent Support', name: 'Marc Lefèvre', initials: 'ML', color: 'bg-sky-500' },
      url: ref ? `/refunds/${ref}?simulatedRole=agent` : '/agent',
      tip: 'Boutons d\'action visuels : Approuver, Demander info, Escalader, Rejeter.',
      act: 'Acte 4 — Décision',
      targetStatus: 'PENDING_LEAD_APPROVAL',
    },
    {
      title: 'Vanessa (Responsable) valide le dossier',
      subtitle: 'Le responsable contrôle avant transmission à la finance. Audit trail complet.',
      role: { id: 'lead', label: 'Responsable', name: 'Vanessa Durand', initials: 'VD', color: 'bg-amber-500' },
      url: ref ? `/refunds/${ref}?simulatedRole=lead` : '/lead',
      tip: 'Double contrôle pour les sommes sensibles.',
      act: 'Acte 4 — Validation',
    },
    {
      title: 'Isabelle (Finance) déclenche le virement',
      subtitle: 'L\'équipe finance reçoit les dossiers approuvés et lance le processus de paiement.',
      role: { id: 'finance', label: 'Finance', name: 'Isabelle Roux', initials: 'IR', color: 'bg-emerald-500' },
      url: ref ? `/refunds/${ref}?simulatedRole=finance` : '/finance',
      tip: 'Boutons d\'action pour initier puis confirmer le paiement.',
      act: 'Acte 4 — Paiement',
      targetStatus: 'APPROVED_FOR_PAYMENT',
    },
    {
      title: 'Stripe — exécution du virement SEPA',
      subtitle: 'Reflow communique avec Stripe via API. Isabelle voit en direct le pipeline de traitement.',
      role: { id: 'finance', label: 'Finance', name: 'Isabelle Roux', initials: 'IR', color: 'bg-emerald-500' },
      url: ref ? `/stripe/${ref}` : '/finance',
      tip: 'Cliquez "Initier le virement" pour voir l\'animation : validation → anti-fraude → SEPA → confirmation.',
      act: 'Acte 4 — Processeur de paiement',
      targetStatus: 'PAYMENT_PROCESSING',
    },

    // ─── Acte V : Résolution ───
    {
      title: 'Alice reçoit la confirmation de virement',
      subtitle: 'Email de confirmation avec la référence du paiement et le délai de réception bancaire.',
      role: { id: 'client', label: 'Cliente', name: 'Alice Wonder', initials: 'AW', color: 'bg-rose-500' },
      url: '/mail',
      tip: 'Email "Virement effectué ✓" avec carte verte de confirmation.',
      act: 'Acte 5 — Résolution',
      targetStatus: 'PAID',
    },
    {
      title: 'Espace client — Remboursée 🎉',
      subtitle: 'Alice voit son remboursement comme payé. Carte de succès, sentiment de relief.',
      role: { id: 'client', label: 'Cliente', name: 'Alice Wonder', initials: 'AW', color: 'bg-rose-500' },
      url: ref ? `/refunds/${ref}?simulatedRole=client` : '/client',
      tip: 'Stepper 100% complet. Confirmation visuelle forte.',
      act: 'Acte 5 — Satisfaction',
    },
  ];
}

// ── Component ──────────────────────────────────────────────────────────

export default function PresentationFrame({ ids, initialStep = 0 }) {
  const slides = buildSlides(ids);
  const [step, setStep] = useState(Math.min(initialStep, slides.length - 1));
  const [hidden, setHidden] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef(null);

  const slide = slides[step];
  const isLoginSlide = slide.url === '/login';

  const handleQuickLogin = (label) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'reflow:quick-login', label }, '*');
  };

  // Advance the refund status server-side when arriving on a slide that requires it
  useEffect(() => {
    if (!slide.targetStatus || !ids.refundId) return;
    let cancelled = false;
    setAdvancing(true);
    fetch('/api/demo/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: slide.targetStatus }),
    })
      .then(() => { if (!cancelled) { setIframeKey(k => k + 1); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAdvancing(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); setStep(s => Math.min(s + 1, slides.length - 1)); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setStep(s => Math.max(s - 1, 0)); }
      else if (e.key === 'h' || e.key === 'H') { setHidden(h => !h); }
      else if (e.key === 'Escape') { setHidden(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slides.length]);

  const handleReset = async () => {
    if (!confirm('Réinitialiser la présentation (revenir au tout début, dossier neuf) ?')) return;
    setResetting(true);
    try {
      await fetch('/api/refunds/seed', { method: 'POST' });
      await fetch('/api/demo/setup', { method: 'POST' });
      window.location.href = `/presentation?step=0`;
    } catch (e) {
      alert('Erreur reset : ' + e.message);
      setResetting(false);
    }
  };

  // Group slides by act for the sidebar
  const groupedSlides = slides.reduce((acc, s, i) => {
    const last = acc[acc.length - 1];
    if (last && last.act === s.act) {
      last.items.push({ ...s, index: i });
    } else {
      acc.push({ act: s.act, items: [{ ...s, index: i }] });
    }
    return acc;
  }, []);

  const SIDEBAR_W = hidden ? 0 : 360;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      {/* Left sidebar — navigation, steps, role context */}
      {!hidden && (
        <aside className="w-[360px] shrink-0 h-screen flex flex-col bg-white border-r" style={{ borderColor: '#e5e7eb' }}>
          {/* Header */}
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#e5e7eb' }}>
            <Link href="/" className="flex items-center gap-2 group">
              <Logo size={28} />
              <div>
                <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-blue-600 transition-colors">Reflow · Démo</p>
                <p className="text-[10px] text-gray-400 leading-none mt-1">Étape {step + 1} / {slides.length}</p>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                disabled={resetting}
                title="Réinitialiser"
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${resetting ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setHidden(true)}
                title="Masquer (H)"
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <Link href="/overview" title="Quitter" className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </Link>
            </div>
          </div>

          {/* Active role + tracked dossier */}
          <div className="px-5 py-3 border-b bg-gray-50" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${slide.role.color}`}>
                {slide.role.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">Vue {slide.role.label}</p>
                <p className="text-sm font-bold text-gray-900 leading-none mt-1 truncate">{slide.role.name}</p>
              </div>
              {advancing && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />}
            </div>
            {ids.ticketId && (
              <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-md border" style={{ borderColor: '#e5e7eb' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <p className="text-[10px] text-gray-400 leading-none">Dossier</p>
                <p className="text-[11px] font-mono font-semibold text-gray-700 leading-none">{ids.ticketId}</p>
                <span className="ml-auto text-[11px] font-bold text-gray-700 leading-none">€159,99</span>
              </div>
            )}
          </div>

          {/* Quick login — only on /login slide */}
          {isLoginSlide && (
            <div className="px-5 py-4 border-b bg-blue-50/40" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <KeyRound className="w-3 h-3 text-blue-600" />
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Accès rapide — démo</p>
              </div>
              <p className="text-[11px] text-gray-500 mb-3 leading-snug">
                Cliquez un rôle pour pré-remplir et soumettre automatiquement le formulaire de la fenêtre.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_LOGINS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => handleQuickLogin(preset.label)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${preset.color}`} />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step list */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {groupedSlides.map(group => (
              <div key={group.act} className="mb-3">
                <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {group.act}
                </p>
                {group.items.map(item => {
                  const isActive = item.index === step;
                  const isDone = item.index < step;
                  return (
                    <button
                      key={item.index}
                      onClick={() => setStep(item.index)}
                      className={`w-full text-left flex items-start gap-2.5 px-2 py-2 rounded-lg transition-all ${
                        isActive ? 'bg-blue-50 ring-1 ring-blue-200'
                        : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[9px] font-bold ${
                        isDone ? 'bg-emerald-500 text-white'
                        : isActive ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isDone ? '✓' : item.index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${isActive ? 'font-semibold text-gray-900' : isDone ? 'text-gray-500' : 'text-gray-600'}`}>
                          {item.title}
                        </p>
                        {isActive && (
                          <p className="text-[10px] text-gray-400 leading-snug mt-1">{item.subtitle}</p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded shrink-0 flex items-center justify-center text-white text-[9px] font-bold ${item.role.color}`} title={item.role.label}>
                        {item.role.initials}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tip + nav buttons */}
          <div className="border-t" style={{ borderColor: '#e5e7eb' }}>
            {slide.tip && (
              <div className="px-4 py-3 bg-blue-50/40 border-b" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex items-start gap-2">
                  <span className="text-sm shrink-0">💡</span>
                  <p className="text-[11px] text-blue-900 leading-5">{slide.tip}</p>
                </div>
              </div>
            )}
            <div className="px-4 py-3 flex items-center gap-2">
              <button
                onClick={() => setStep(s => Math.max(s - 1, 0))}
                disabled={step === 0}
                className="w-9 h-9 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                style={{ borderColor: '#e5e7eb' }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setStep(s => Math.min(s + 1, slides.length - 1))}
                disabled={step === slides.length - 1}
                className="flex-1 h-9 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-gray-300 text-center pb-2 px-4">
              ← → naviguer · H masquer · Échap cacher
            </p>
          </div>
        </aside>
      )}

      {/* Iframe — clean capture area */}
      <main className="flex-1 min-w-0 h-screen relative bg-white">
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={slide.url}
          className="w-full h-full border-0"
        />
        {hidden && (
          <button
            onClick={() => setHidden(false)}
            className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white rounded-full px-4 py-2.5 text-xs font-semibold shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Play className="w-3 h-3 fill-white" />
            Afficher la sidebar
          </button>
        )}
      </main>
    </div>
  );
}
