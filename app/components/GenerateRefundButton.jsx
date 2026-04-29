'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shuffle } from 'lucide-react';

export default function GenerateRefundButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/refunds/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');

      const { refund } = data;
      const flagNote = refund.isFlagged ? ' — signalée' : '';
      toast.success(`Demande créée : ${refund.ticketId}`, {
        description: `${refund.clientFirstName} ${refund.clientLastName} · ${refund.amount.toFixed(2)} ${refund.currency} · Statut : ${refund.status.replace(/_/g, ' ')}${flagNote}`,
        action: {
          label: 'Voir',
          onClick: () => router.push(`/refunds/${refund.id}?simulatedRole=agent`),
        },
        duration: 6000,
      });
      router.refresh();
    } catch (err) {
      toast.error('Échec de la génération', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors disabled:opacity-50"
      style={{
        borderColor: 'hsl(220,13%,89%)',
        color: loading ? '#9ca3af' : '#374151',
        background: 'white',
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'hsl(220,20%,97%)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
    >
      <Shuffle className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Génération…' : 'Générer une demande'}
    </button>
  );
}
