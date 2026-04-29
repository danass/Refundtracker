'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Tag, Clock, User, ChevronDown, Paperclip, MoreHorizontal, Search, Bell, Grid, ChevronRight, Zap, CheckCircle2, Loader2, Database, Send } from 'lucide-react';

const AGENT_AVATAR = 'ML';
const AGENT_NAME = 'Marc Lefèvre';
const CLIENT_INITIALS = (f, l) => `${f?.[0] ?? ''}${l?.[0] ?? ''}`.toUpperCase();

function ZdBadge({ color, children }) {
  const colors = {
    new:     'bg-red-100 text-red-700 border-red-200',
    open:    'bg-amber-100 text-amber-700 border-amber-200',
    pending: 'bg-blue-100 text-blue-700 border-blue-200',
    solved:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    closed:  'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${colors[color] || colors.open}`}>
      {children}
    </span>
  );
}

export default function ZendeskView({ refund }) {
  const router = useRouter();
  const [declarePhase, setDeclarePhase] = useState('idle'); // idle | running | done
  const [declareStep, setDeclareStep] = useState(0);

  const handleDeclareInReflow = async () => {
    setDeclarePhase('running');
    setDeclareStep(0);
    // Animate through 4 sub-steps
    const steps = [600, 800, 700, 900];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, steps[i]));
      setDeclareStep(i + 1);
    }
    setDeclarePhase('done');
    await new Promise(r => setTimeout(r, 1200));
    router.push('/login');
  };

  const zdId = refund.zendeskTicketId || refund.ticketId;
  const createdAt = new Date(refund.createdAt);
  const sym = refund.currency === 'EUR' ? '€' : refund.currency === 'USD' ? '$' : '£';

  // Build fake conversation thread
  const messages = [
    {
      id: 1,
      from: `${refund.clientFirstName} ${refund.clientLastName}`,
      initials: CLIENT_INITIALS(refund.clientFirstName, refund.clientLastName),
      role: 'client',
      time: createdAt,
      body: `Bonjour,\n\nJe vous contacte au sujet d'un remboursement que je souhaite obtenir.\n\nMotif : ${refund.reason}\n\nMontant concerné : ${sym}${refund.amount?.toFixed(2)}\nCommande : ${refund.orderId || 'non précisé'}\n\nMerci de bien vouloir traiter ma demande dans les meilleurs délais.\n\nCordialement,\n${refund.clientFirstName} ${refund.clientLastName}`,
    },
    {
      id: 2,
      from: 'Support Clear',
      initials: 'CL',
      role: 'system',
      time: new Date(createdAt.getTime() + 12 * 60000),
      body: `Bonjour ${refund.clientFirstName},\n\nNous avons bien reçu votre demande et lui avons attribué le numéro de ticket ${zdId}.\n\nUn agent va prendre en charge votre dossier prochainement. Vous recevrez une notification dès qu'une action sera réalisée.\n\nCordialement,\nL'équipe Support Clear`,
    },
    {
      id: 3,
      from: AGENT_NAME,
      initials: AGENT_AVATAR,
      role: 'agent',
      time: new Date(createdAt.getTime() + 2 * 3600000),
      body: `Bonjour ${refund.clientFirstName},\n\nMerci pour votre demande. J'ai bien pris en compte votre dossier de remboursement pour ${sym}${refund.amount?.toFixed(2)}.\n\nAfin de procéder au virement, pourriez-vous nous communiquer vos coordonnées bancaires (IBAN et BIC) ?\n\nJe reste à votre disposition pour toute question.\n\nCordialement,\n${AGENT_NAME}\nAgent Support — Clear`,
      internal: false,
    },
    ...(refund.agentNotes ? [{
      id: 4,
      from: AGENT_NAME,
      initials: AGENT_AVATAR,
      role: 'agent',
      time: new Date(createdAt.getTime() + 4 * 3600000),
      body: refund.agentNotes,
      internal: true,
    }] : []),
  ];

  const zdStatus = refund.status === 'PAID' ? 'solved'
    : refund.status?.includes('REJECT') || refund.status?.includes('CANCEL') ? 'closed'
    : refund.status === 'PENDING_AGENT_REVIEW' || refund.status === 'CLIENT_VALIDATED' ? 'open'
    : 'pending';

  return (
    <div className="min-h-screen bg-white flex flex-col text-[13px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Zendesk top nav */}
      <div className="h-10 bg-[#1f73b7] flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">Z</span>
          </div>
          <span className="text-white text-xs font-semibold">Zendesk Support</span>
        </div>
        <div className="flex-1 flex items-center gap-1 mx-4">
          <div className="flex-1 max-w-xs h-6 bg-white/20 rounded flex items-center px-2 gap-1.5">
            <Search className="w-3 h-3 text-white/70" />
            <span className="text-white/60 text-xs">Rechercher…</span>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <Bell className="w-4 h-4 text-white/70" />
          <Grid className="w-4 h-4 text-white/70" />
          <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">{AGENT_AVATAR}</span>
          </div>
        </div>
      </div>

      {/* Second nav bar */}
      <div className="h-9 border-b bg-white flex items-center px-4 gap-4 text-xs text-gray-500 shrink-0" style={{ borderColor: '#d8dcde' }}>
        <span className="font-medium text-[#1f73b7] cursor-pointer">Vues</span>
        <span className="cursor-pointer hover:text-gray-700">Tableau de bord</span>
        <span className="cursor-pointer hover:text-gray-700">Rapports</span>
        <span className="cursor-pointer hover:text-gray-700">Administration</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleDeclareInReflow}
            disabled={declarePhase !== 'idle'}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#635bff] to-[#7c5dff] text-white rounded text-xs font-bold hover:shadow-lg disabled:opacity-60 transition-all"
          >
            {declarePhase === 'idle' && (<><Zap className="w-3 h-3" /> Déclarer dans Reflow</>)}
            {declarePhase === 'running' && (<><Loader2 className="w-3 h-3 animate-spin" /> Création en cours…</>)}
            {declarePhase === 'done' && (<><CheckCircle2 className="w-3 h-3" /> Créé dans Reflow</>)}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar — ticket list */}
        <div className="w-56 border-r bg-[#f3f4f5] shrink-0 overflow-y-auto" style={{ borderColor: '#d8dcde' }}>
          <div className="px-3 py-2 border-b text-[11px] font-semibold text-gray-500 uppercase tracking-wide" style={{ borderColor: '#d8dcde' }}>
            Mes tickets ouverts
          </div>
          {[zdId, 'ZD-10042', 'ZD-10039', 'ZD-10035', 'ZD-10031'].map((id, i) => (
            <div key={id}
              className={`px-3 py-2.5 border-b cursor-pointer transition-colors ${i === 0 ? 'bg-[#e8f0fe] border-l-2 border-l-[#1f73b7]' : 'hover:bg-white'}`}
              style={{ borderColor: '#d8dcde' }}>
              <p className="font-medium text-gray-800 text-xs truncate">{i === 0 ? `${refund.clientFirstName} ${refund.clientLastName}` : ['Sophie Martin', 'Lucas Bernard', 'Emma Dubois', 'Hugo Thomas'][i-1]}</p>
              <p className="text-gray-500 text-[11px] truncate mt-0.5">{i === 0 ? refund.reason?.slice(0, 35) + '…' : ['Double facturation', 'Article non conforme', 'Commande annulée', 'Abonnement résilié'][i-1]}</p>
              <p className="text-gray-400 text-[10px] mt-1">{id}</p>
            </div>
          ))}
        </div>

        {/* Main ticket area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Ticket header */}
          <div className="px-6 py-3 border-b bg-white shrink-0" style={{ borderColor: '#d8dcde' }}>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1.5">
              <span className="hover:text-[#1f73b7] cursor-pointer">Tickets</span>
              <ChevronRight className="w-3 h-3" />
              <span>{zdId}</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-gray-900">
                  Demande de remboursement — {sym}{refund.amount?.toFixed(2)} — {refund.reason?.slice(0,50)}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <ZdBadge color={zdStatus}>{zdStatus === 'open' ? 'Ouvert' : zdStatus === 'pending' ? 'En attente' : zdStatus === 'solved' ? 'Résolu' : 'Fermé'}</ZdBadge>
                  <span className="text-gray-400 text-[11px]">#{zdId}</span>
                  <span className="text-gray-400 text-[11px]">·</span>
                  <span className="text-gray-400 text-[11px]">Ouvert {createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="text-gray-400 text-[11px]">·</span>
                  <span className="text-[#1f73b7] text-[11px] cursor-pointer font-medium">{refund.ticketId}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="px-3 py-1.5 border rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors" style={{ borderColor: '#d8dcde' }}>
                  Envoyer
                </button>
                <button className="px-3 py-1.5 bg-[#1f73b7] text-white rounded text-xs font-medium hover:bg-[#1a65a3] transition-colors flex items-center gap-1">
                  Soumettre comme résolu
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button className="w-7 h-7 border rounded flex items-center justify-center hover:bg-gray-50 transition-colors" style={{ borderColor: '#d8dcde' }}>
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Conversation */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-[#fafafa]">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.internal ? 'opacity-80' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                    msg.role === 'client' ? 'bg-violet-100 text-violet-700'
                    : msg.role === 'agent' ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-500'
                  }`}>
                    {msg.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`rounded-lg px-4 py-3 ${
                      msg.internal ? 'bg-yellow-50 border border-yellow-200'
                      : msg.role === 'client' ? 'bg-white border shadow-sm'
                      : msg.role === 'system' ? 'bg-gray-50 border border-dashed'
                      : 'bg-white border shadow-sm'
                    }`} style={{ borderColor: msg.internal ? undefined : '#d8dcde' }}>
                      {msg.internal && (
                        <p className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wide mb-1.5">Note interne</p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800 text-xs">{msg.from}</span>
                        <span className="text-gray-400 text-[11px]">
                          {msg.time.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à {msg.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-700 text-xs whitespace-pre-line leading-5">{msg.body}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Reply box */}
              <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: '#d8dcde' }}>
                <div className="flex border-b text-xs" style={{ borderColor: '#d8dcde' }}>
                  {['Répondre', 'Note interne', 'Transférer'].map((t, i) => (
                    <button key={t} className={`px-4 py-2 font-medium transition-colors ${i === 0 ? 'text-[#1f73b7] border-b-2 border-[#1f73b7]' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
                  ))}
                </div>
                <div className="px-4 py-3">
                  <div className="text-xs text-gray-400 mb-2">À : <span className="text-gray-700">{refund.clientFirstName} {refund.clientLastName} &lt;{refund.clientEmail}&gt;</span></div>
                  <div className="min-h-16 text-xs text-gray-300 italic">Tapez votre réponse ici…</div>
                </div>
                <div className="px-4 py-2 border-t flex items-center gap-2" style={{ borderColor: '#d8dcde' }}>
                  <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><Paperclip className="w-3.5 h-3.5 text-gray-400" /></button>
                  <div className="ml-auto flex gap-2">
                    <button className="px-3 py-1.5 border rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors" style={{ borderColor: '#d8dcde' }}>Annuler</button>
                    <button className="px-3 py-1.5 bg-[#1f73b7] text-white rounded text-xs font-medium hover:bg-[#1a65a3] transition-colors">Envoyer</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right sidebar — ticket properties */}
            <div className="w-64 border-l bg-white overflow-y-auto shrink-0" style={{ borderColor: '#d8dcde' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#d8dcde' }}>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Propriétés</p>
                <div className="space-y-3">
                  <ZdField label="Statut"><ZdBadge color={zdStatus}>{zdStatus === 'open' ? 'Ouvert' : zdStatus === 'pending' ? 'En attente' : zdStatus === 'solved' ? 'Résolu' : 'Fermé'}</ZdBadge></ZdField>
                  <ZdField label="Assigné à"><span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center">{AGENT_AVATAR}</span>{AGENT_NAME}</span></ZdField>
                  <ZdField label="Groupe">Support L1</ZdField>
                  <ZdField label="Type">Incident</ZdField>
                  <ZdField label="Priorité"><span className="text-amber-600 font-medium">Normale</span></ZdField>
                </div>
              </div>

              <div className="px-4 py-3 border-b" style={{ borderColor: '#d8dcde' }}>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Demandeur</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {CLIENT_INITIALS(refund.clientFirstName, refund.clientLastName)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-xs">{refund.clientFirstName} {refund.clientLastName}</p>
                    <p className="text-gray-400 text-[10px]">{refund.clientEmail}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-b" style={{ borderColor: '#d8dcde' }}>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Champs personnalisés</p>
                <div className="space-y-2">
                  <ZdField label="Montant">{`${sym}${refund.amount?.toFixed(2)} ${refund.currency}`}</ZdField>
                  <ZdField label="Commande">{refund.orderId || '—'}</ZdField>
                  <ZdField label="Ticket Reflow">
                    <Link href={`/refunds/${refund.id}?simulatedRole=agent`} className="text-[#635bff] hover:underline flex items-center gap-0.5 font-medium">
                      {refund.ticketId} <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </ZdField>
                  <ZdField label="IBAN fourni"><span className={refund.iban ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{refund.iban ? 'Oui' : 'Non'}</span></ZdField>
                </div>
              </div>

              <div className="px-4 py-3">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {['remboursement', refund.currency?.toLowerCase(), refund.isFlagged ? 'signalé' : null, 'support-l1'].filter(Boolean).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Declare-in-Reflow modal overlay */}
      {declarePhase !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-3 border-b" style={{ borderColor: '#e5e7eb' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#1f73b7] to-[#0e5a96]">
                <Send className="w-4 h-4 text-white" />
              </div>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#635bff] to-[#7c5dff]">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div className="ml-2">
                <p className="text-sm font-bold text-gray-900">
                  {declarePhase === 'done' ? 'Demande créée dans Reflow' : 'Création de la demande dans Reflow'}
                </p>
                <p className="text-xs text-gray-400">Zendesk → Reflow API</p>
              </div>
            </div>

            {/* Steps */}
            <div className="px-6 py-5 space-y-3">
              <DeclareStep
                idx={1}
                done={declareStep >= 1}
                active={declareStep === 0}
                label="Extraction des données du ticket"
                detail={`Ticket ${zdId} · ${refund.clientFirstName} ${refund.clientLastName}`}
              />
              <DeclareStep
                idx={2}
                done={declareStep >= 2}
                active={declareStep === 1}
                label="Validation des champs requis"
                detail="Montant, motif, identité bénéficiaire"
              />
              <DeclareStep
                idx={3}
                done={declareStep >= 3}
                active={declareStep === 2}
                label="POST /api/refunds — Reflow"
                detail={`${refund.currency === 'EUR' ? '€' : '$'}${refund.amount?.toFixed(2)} ${refund.currency}`}
              />
              <DeclareStep
                idx={4}
                done={declareStep >= 4}
                active={declareStep === 3}
                label="Synchronisation des identifiants"
                detail={`${refund.ticketId} ↔ ${zdId}`}
              />
            </div>

            {/* Success footer */}
            {declarePhase === 'done' && (
              <div className="px-6 pb-6">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">Dossier {refund.ticketId} créé</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Connexion à Reflow…</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DeclareStep({ idx, done, active, label, detail }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
        done ? 'bg-emerald-500'
        : active ? 'bg-blue-100 ring-2 ring-blue-400'
        : 'bg-gray-100'
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4 text-white" />
        : active ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        : <span className="text-[11px] font-semibold text-gray-300">{idx}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'text-gray-700' : active ? 'text-blue-700' : 'text-gray-400'}`}>{label}</p>
        <p className="text-[11px] text-gray-400 truncate">{detail}</p>
      </div>
    </div>
  );
}

function ZdField({ label, children }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
      <p className="text-xs text-gray-700">{children}</p>
    </div>
  );
}
