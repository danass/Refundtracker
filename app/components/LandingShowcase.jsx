'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Headphones, Zap, LogIn, Inbox, FileSearch, Mail, User, AlertTriangle, Clock, CheckCircle, Send, ShieldCheck, CreditCard, Banknote, MailCheck, PartyPopper, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

// Slides ordered by the user — each maps to a screenshot in /public/screencaptures
const TABS = [
  { id: 's01', file: '01-on-merchant-client.png',
    label: 'Le client sur le site marchand', sub: 'Acte 1 — Achat',
    role: 'Client',  roleColor: 'bg-rose-500',
    icon: ShoppingBag,
    caption: 'Alice consulte sa commande sur SoundWave et constate un problème.',
  },
  { id: 's02', file: '02-on-merchant-ask-for-refund-client.png',
    label: 'Demande de remboursement', sub: 'Acte 1 — Réclamation',
    role: 'Client',  roleColor: 'bg-rose-500',
    icon: AlertTriangle,
    caption: 'En un clic, Alice signale le problème et déclenche une demande.',
  },
  { id: 's03', file: '03-refund-sent-client.png',
    label: 'Demande envoyée', sub: 'Acte 1 — Confirmation',
    role: 'Client',  roleColor: 'bg-rose-500',
    icon: CheckCircle,
    caption: 'Sa demande est enregistrée. Numéro de suivi communiqué immédiatement.',
  },
  { id: 's04', file: '04-agent-handles-in-zendesk-agent.png',
    label: 'L\'agent traite dans Zendesk', sub: 'Acte 2 — Réception',
    role: 'Agent',   roleColor: 'bg-sky-500',
    icon: Headphones,
    caption: 'Le ticket atterrit dans Zendesk avec tout le contexte client.',
  },
  { id: 's04b', file: '04-zoom-on-reflow-button.png',
    label: 'Bouton "Déclarer dans Reflow"', sub: 'Acte 2 — Bascule',
    role: 'Agent',   roleColor: 'bg-sky-500',
    icon: Zap,
    caption: 'Un seul clic pour transformer le ticket Zendesk en dossier Reflow.',
  },
  { id: 's05', file: '05-creation-depuis-zendesk-dans-reflow.png',
    label: 'Création dans Reflow', sub: 'Acte 2 — Synchro API',
    role: 'Agent',   roleColor: 'bg-sky-500',
    icon: Send,
    caption: 'Pipeline 4 étapes : extraction → validation → POST API → sync identifiants.',
  },
  { id: 's06', file: '06-login-connection-en-cours-agent.png',
    label: 'Connexion à Reflow', sub: 'Acte 2 — Login',
    role: 'Agent',   roleColor: 'bg-sky-500',
    icon: LogIn,
    caption: 'Marc se connecte à son espace Reflow.',
  },
  { id: 's07', file: '07-vue-agent-in-reflow-new-request-by-alice-appear-agent.png',
    label: 'Le dossier d\'Alice apparaît', sub: 'Acte 2 — File de traitement',
    role: 'Agent',   roleColor: 'bg-sky-500',
    icon: Inbox,
    caption: 'La nouvelle demande remonte dans la file "En attente IBAN".',
  },
  { id: 's08', file: '08-alice-detailed-refund-view-agent.png',
    label: 'Vue détaillée du dossier', sub: 'Acte 2 — Analyse',
    role: 'Agent',   roleColor: 'bg-sky-500',
    icon: FileSearch,
    caption: 'Marc analyse le dossier : montant, identité, motif, anomalies.',
  },
  { id: 's08b', file: '08-zoom-sur-les-infos-manquantes-iban.png',
    label: 'IBAN manquant détecté', sub: 'Acte 2 — Anomalie',
    role: 'Agent',   roleColor: 'bg-sky-500',
    icon: AlertTriangle,
    caption: 'La checklist signale l\'IBAN manquant. Une relance est envoyée.',
  },
  { id: 's09', file: '09-boite-mail-alice-iban-maquant.png',
    label: 'Email reçu par Alice', sub: 'Acte 3 — Notification',
    role: 'Client',  roleColor: 'bg-rose-500',
    icon: Mail,
    caption: 'Alice reçoit un email "Action requise" avec un lien direct.',
  },
  { id: 's10', file: '10-in-reflow-vue-alice-pour-ajouter-son-iban.png',
    label: 'Espace client — Ajout IBAN', sub: 'Acte 3 — Saisie',
    role: 'Client',  roleColor: 'bg-rose-500',
    icon: User,
    caption: 'Sur son espace, Alice voit clairement quoi faire et où elle en est.',
  },
  { id: 's11', file: '11-alice-fait-une-erreur-sur-le-code-et-cela-empeche-la-validation.png',
    label: 'Validation IBAN — erreur', sub: 'Acte 3 — Robustesse',
    role: 'Client',  roleColor: 'bg-rose-500',
    icon: AlertTriangle,
    caption: 'Le format IBAN est validé en temps réel pour éviter les erreurs.',
  },
  { id: 's12', file: '12-alice-valide-son-iban-et-doit-attendre.png',
    label: 'IBAN validé · en attente', sub: 'Acte 3 — Soumission',
    role: 'Client',  roleColor: 'bg-rose-500',
    icon: Clock,
    caption: 'Le stepper avance — Alice voit que son dossier passe en vérification.',
  },
  { id: 's13', file: '13-lagent-voit-la-demande-dalice-dans-son-dossier-a-traiter-car-liban-est-fourni.png',
    label: 'IBAN reçu côté agent', sub: 'Acte 4 — Traitement',
    role: 'Agent',   roleColor: 'bg-sky-500',
    icon: CheckCircle,
    caption: 'Le dossier remonte dans "IBAN reçu" — fond vert, prêt à approuver.',
  },
  { id: 's14', file: '14-lagent-escalade-a-son-manager.png',
    label: 'Escalade au responsable', sub: 'Acte 4 — Décision',
    role: 'Agent',   roleColor: 'bg-sky-500',
    icon: Send,
    caption: 'Selon le montant, l\'agent escalade au responsable pour validation.',
  },
  { id: 's15', file: '15-le-manager-approuve.png',
    label: 'Le responsable approuve', sub: 'Acte 4 — Validation',
    role: 'Responsable', roleColor: 'bg-amber-500',
    icon: ShieldCheck,
    caption: 'Vanessa contrôle le dossier et le transmet à la finance.',
  },
  { id: 's16', file: '16-la-finance-paie.png',
    label: 'La finance déclenche le paiement', sub: 'Acte 4 — Virement',
    role: 'Finance', roleColor: 'bg-emerald-500',
    icon: CreditCard,
    caption: 'Isabelle initie le virement SEPA depuis Reflow.',
  },
  { id: 's16b', file: '16-zoom-bouton.png',
    label: 'Bouton de paiement Stripe', sub: 'Acte 4 — Action finance',
    role: 'Finance', roleColor: 'bg-emerald-500',
    icon: Banknote,
    caption: 'Un clic, et le paiement est routé vers Stripe SEPA.',
  },
  { id: 's17', file: '17-paiment-effecut-.png',
    label: 'Paiement exécuté', sub: 'Acte 5 — Exécution',
    role: 'Finance', roleColor: 'bg-emerald-500',
    icon: CheckCircle,
    caption: 'Confirmation Stripe : virement transmis à la banque.',
  },
  { id: 's18', file: '18-paiement-effectue-notification-par-email-boite-email-alice.png',
    label: 'Notification email Alice', sub: 'Acte 5 — Communication',
    role: 'Client',  roleColor: 'bg-rose-500',
    icon: MailCheck,
    caption: 'Alice reçoit l\'email "Virement effectué ✓".',
  },
  { id: 's19', file: '19-confirmation-vue-reflow-alice-remboursement-effecut-.png',
    label: 'Remboursée 🎉', sub: 'Acte 5 — Résolution',
    role: 'Client',  roleColor: 'bg-rose-500',
    icon: PartyPopper,
    caption: 'Sur son espace, Alice voit le statut final. Sentiment de relief.',
  },
];

const ACTS = ['Acte 1 — Achat', 'Acte 1 — Réclamation', 'Acte 2 — Réception', 'Acte 3 — Notification', 'Acte 4 — Traitement', 'Acte 5 — Exécution', 'Acte 5 — Résolution'];

export default function LandingShowcase() {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const t = setInterval(() => setActive(a => (a + 1) % TABS.length), 4000);
    return () => clearInterval(t);
  }, [autoplay]);

  const tab = TABS[active];

  return (
    <section id="showcase" className="bg-gradient-to-b from-gray-50 to-white border-y" style={{ borderColor: 'hsl(220,13%,93%)' }}>
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Le produit en action</p>
          <h2 className="text-4xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
            Du clic client au virement bancaire,<br/>chaque étape orchestrée.
          </h2>
          <p className="mt-4 text-base text-gray-500 max-w-2xl mx-auto">
            Suivez Alice à travers les <span className="font-semibold text-gray-700">22 écrans clés</span> du parcours de remboursement.
          </p>
        </div>

        {/* Mockup */}
        <div className="rounded-2xl border bg-white shadow-2xl overflow-hidden mb-6" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
            </div>
            <div className="ml-4 flex items-center gap-2 flex-1 max-w-md bg-white rounded-md px-2.5 py-1 text-xs border" style={{ borderColor: 'hsl(220,13%,89%)' }}>
              <span className={`w-1.5 h-1.5 rounded-full ${tab.roleColor} shrink-0`} />
              <span className="text-gray-400 font-mono truncate">reflow.app</span>
              <span className="ml-auto text-[10px] text-gray-300 shrink-0">{tab.role}</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setAutoplay(p => !p)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label={autoplay ? 'Pause' : 'Lecture'}
              >
                {autoplay
                  ? <Pause className="w-3.5 h-3.5 text-gray-500" />
                  : <Play className="w-3.5 h-3.5 text-gray-500" />}
              </button>
              <button
                onClick={() => { setActive(a => (a - 1 + TABS.length) % TABS.length); setAutoplay(false); }}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label="Précédent"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <button
                onClick={() => { setActive(a => (a + 1) % TABS.length); setAutoplay(false); }}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label="Suivant"
              >
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Image — cross-fade */}
          <div className="relative aspect-[16/10] bg-gray-50 overflow-hidden">
            {TABS.map((t, i) => (
              <img
                key={t.id}
                src={`/screencaptures/${t.file}`}
                alt={t.label}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${i === active ? 'opacity-100' : 'opacity-0'}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                onError={(e) => { e.currentTarget.style.opacity = '0'; }}
              />
            ))}
          </div>

          {/* Caption inline */}
          <div className="px-6 py-4 border-t flex items-center gap-4" style={{ borderColor: 'hsl(220,13%,93%)' }}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tab.roleColor}`}>
              <tab.icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tab.sub}</p>
                <span className="text-gray-200">·</span>
                <p className={`text-[10px] font-bold uppercase tracking-wider`} style={{ color: 'rgb(107,114,128)' }}>{tab.role}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{tab.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{tab.caption}</p>
            </div>
            <span className="text-xs font-mono text-gray-300 shrink-0">{String(active + 1).padStart(2, '0')} / {String(TABS.length).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-11 gap-2">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => { setActive(i); setAutoplay(false); }}
              className={`group relative aspect-[16/10] rounded-md overflow-hidden border-2 transition-all ${
                i === active ? 'border-gray-900 shadow-md scale-105' : 'border-transparent hover:border-gray-300'
              }`}
              title={t.label}
            >
              <img
                src={`/screencaptures/${t.file}`}
                alt=""
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
              <span className={`absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[8px] font-bold text-white ${t.roleColor}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {i === active && (
                <div className="absolute inset-0 ring-2 ring-blue-400 ring-inset pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
