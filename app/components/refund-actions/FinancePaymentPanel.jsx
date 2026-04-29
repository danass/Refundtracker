'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Clock, Zap, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { financeTriggerPayment } from '@/app/actions/financeActions';

const STRIPE_PURPLE = '#635bff';

const STEPS = [
  { label: 'Validation du compte bénéficiaire', delay: 600 },
  { label: 'Vérification anti-fraude (Radar)', delay: 800 },
  { label: 'Routage vers la banque (SEPA)', delay: 1000 },
  { label: "Confirmation de l'instruction de virement", delay: 700 },
];

function ProcessStep({ done, active, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        done ? 'bg-emerald-500' : active ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-100'
      }`}>
        {done ? <CheckCircle2 className="w-3 h-3 text-white" />
        : active ? <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
        : <Clock className="w-2.5 h-2.5 text-gray-300" />}
      </div>
      <span className={`text-xs ${done ? 'text-gray-700' : active ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

function PanelHeader({ children }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: STRIPE_PURPLE }}>
        <span className="text-white text-[10px] font-bold italic">S</span>
      </div>
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{children}</span>
    </div>
  );
}

export default function FinancePaymentPanel({ refundRequest, actorName, currentStatus }) {
  // Local UI phase, separate from the server status. While the user just clicked
  // "Initier", the server status will flip to PAYMENT_PROCESSING mid-animation —
  // we don't want the panel to flicker, so the local phase drives what's shown.
  const [phase, setPhase] = useState('idle'); // idle | running | success | error
  const [stepIndex, setStepIndex] = useState(-1);
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const animatedRef = useRef(false);

  // If we mount on a status that's already past APPROVED_FOR_PAYMENT, infer phase
  // so refreshes don't reset to "idle" with a "click to start" button.
  useEffect(() => {
    if (animatedRef.current) return;
    if (currentStatus === 'PAYMENT_PROCESSING') setPhase('running');
    else if (currentStatus === 'PAID') setPhase('success');
    else if (currentStatus === 'ERROR_PROCESSING_PAYMENT') {
      setPhase('error');
      setErrorMsg('Stripe a rejeté l\'instruction de virement.');
    }
  }, [currentStatus]);

  // Drive the visual pipeline only when the user actively clicked
  useEffect(() => {
    if (phase !== 'running' || !animatedRef.current) return;
    let cancelled = false;
    let i = 0;
    setStepIndex(0);
    const tick = () => {
      if (cancelled) return;
      const s = STEPS[i];
      if (!s) return;
      setTimeout(() => {
        if (cancelled) return;
        i += 1;
        setStepIndex(i);
        if (i < STEPS.length) tick();
      }, s.delay);
    };
    tick();
    return () => { cancelled = true; };
  }, [phase]);

  const handleStart = async () => {
    animatedRef.current = true;
    setPhase('running');
    setErrorMsg(null);

    const animPromise = new Promise(resolve => {
      const total = STEPS.reduce((a, s) => a + s.delay, 0);
      setTimeout(resolve, total);
    });

    const formData = new FormData();
    formData.append('refundRequestId', refundRequest.id);
    formData.append('actorName', actorName || 'Finance');
    formData.append('financeNotes', comment || '');

    try {
      const [, result] = await Promise.all([
        animPromise,
        financeTriggerPayment({ error: null, success: false, message: '' }, formData),
      ]);

      if (result?.success) {
        setPhase('success');
        toast.success('Virement initié — Stripe a accepté l\'instruction SEPA.');
      } else {
        setPhase('error');
        setErrorMsg(result?.error || 'Erreur Stripe inconnue');
        toast.error('Échec du virement', { description: result?.error });
      }
    } catch (e) {
      setPhase('error');
      setErrorMsg(e.message || 'Erreur réseau');
      toast.error('Échec du virement', { description: e.message });
    }
  };

  // Already paid (refresh after the fact): show a clean confirmation, no controls
  if (phase === 'success' && currentStatus === 'PAID') {
    return (
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        <PanelHeader>Stripe — Paiement effectué</PanelHeader>
        <div className="px-5 py-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-900">Virement émis avec succès</p>
              <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                L'instruction SEPA a été transmise à la banque. Le client recevra le virement sous 1 à 2 jours ouvrés.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <PanelHeader>
        {phase === 'idle' && 'Stripe — Initier le paiement'}
        {phase === 'running' && 'Stripe — Traitement en cours'}
        {phase === 'success' && 'Stripe — Virement initié'}
        {phase === 'error' && 'Stripe — Erreur'}
      </PanelHeader>

      <div className="px-5 py-4 space-y-4">
        {/* Notes (only when about to start) */}
        {phase === 'idle' && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Notes / Motif
            </label>
            <textarea
              rows="2"
              className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-300 transition-all"
              style={{ borderColor: 'hsl(220,13%,89%)' }}
              placeholder="Notes optionnelles…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}

        {/* Pipeline visualization */}
        {(phase === 'running' || phase === 'success') && (
          <div className="rounded-lg border p-4" style={{ borderColor: '#e3e8ee', background: '#f8fafc' }}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Pipeline Stripe
            </p>
            <div className="space-y-2.5">
              {STEPS.map((s, i) => (
                <ProcessStep
                  key={s.label}
                  done={stepIndex > i || phase === 'success'}
                  active={stepIndex === i && phase === 'running'}
                  label={s.label}
                />
              ))}
            </div>
          </div>
        )}

        {/* Success panel */}
        {phase === 'success' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-900">Virement initié avec succès</p>
              <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                Instruction SEPA transmise. Le bénéficiaire recevra le virement sous 1 à 2 jours ouvrés.
              </p>
            </div>
          </div>
        )}

        {/* Error panel */}
        {phase === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-800">Échec de l'initiation</p>
              <p className="text-[11px] text-red-700 mt-0.5 leading-snug">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Action button */}
        {phase === 'idle' && (
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:shadow-md"
            style={{ background: STRIPE_PURPLE }}
          >
            <Zap className="w-4 h-4" />
            Initier le virement via Stripe
          </button>
        )}
        {phase === 'running' && (
          <div
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white"
            style={{ background: STRIPE_PURPLE, opacity: 0.85 }}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Traitement en cours…
          </div>
        )}
        {phase === 'error' && (
          <button
            onClick={() => { animatedRef.current = false; setPhase('idle'); setStepIndex(-1); }}
            className="w-full px-4 py-2.5 rounded-lg font-medium text-sm border text-gray-700 hover:bg-gray-50"
            style={{ borderColor: 'hsl(220,13%,89%)' }}
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}
