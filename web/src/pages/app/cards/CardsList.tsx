import { useEffect, useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';
import CardForm from './CardForm';
import CreditCardVisual from './CreditCardVisual';

interface CardData {
  id: string;
  name: string;
  brand: string;
  lastFourDigits: string;
  limitInCents: number;
  closingDay: number;
  dueDay: number;
  color: string;
  paymentAccountId: string | null;
  invoices: { totalInCents: number; status: string }[];
}

export default function CardsList() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);

  const fetchCards = async () => { const { data } = await api.get('/cards'); setCards(data); };
  const fetchAccounts = async () => { const { data } = await api.get('/accounts'); setAccounts(data); };

  useEffect(() => { fetchCards(); fetchAccounts(); }, []);

  const getUsedLimit = (card: CardData) => {
    return card.invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.totalInCents, 0);
  };

  const handleDelete = async (id: string) => { await api.delete('/cards/' + id); fetchCards(); };

  return (
    <div className="p-5 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-headline text-text-primary">Cartoes</h1>
        <button
          onClick={() => { setEditingCard(null); setShowForm(true); }}
          className="m3-fab-small"
        >
          <Plus size={18} />
        </button>
      </header>

      <div className="space-y-5">
        {cards.map((card) => {
          const used = getUsedLimit(card);
          const available = card.limitInCents - used;
          const usedPercent = card.limitInCents > 0 ? (used / card.limitInCents) * 100 : 0;

          return (
            <button
              key={card.id}
              onClick={() => { setEditingCard(card); setShowForm(true); }}
              className="w-full text-left"
            >
              <CreditCardVisual
                name={card.name}
                lastFour={card.lastFourDigits}
                brand={card.brand}
                color={card.color}
              />
              <div className="m3-card-elevated p-4 -mt-3 rounded-t-none">
                <div className="flex justify-between text-label mb-2.5">
                  <span className="text-text-secondary">Usado: {formatCurrency(used)}</span>
                  <span className="text-text-secondary">Disponivel: {formatCurrency(available)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-highest">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-spring"
                    style={{
                      width: Math.min(usedPercent, 100) + '%',
                      backgroundColor: usedPercent > 80 ? 'var(--m3-danger)' : 'var(--m3-primary)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-caption text-text-tertiary mt-2">
                  <span>Fecha dia {card.closingDay}</span>
                  <span>Vence dia {card.dueDay}</span>
                </div>
              </div>
            </button>
          );
        })}
        {cards.length === 0 && (
          <div className="m3-card-filled p-10 text-center">
            <CreditCard size={36} className="mx-auto mb-3 text-text-tertiary opacity-50" />
            <p className="text-text-tertiary text-body mb-4">Nenhum cartao cadastrado.</p>
            <button onClick={() => setShowForm(true)} className="m3-btn">
              Adicionar cartao
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <CardForm
          card={editingCard}
          accounts={accounts}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchCards(); }}
          onDelete={editingCard ? () => { handleDelete(editingCard.id); setShowForm(false); } : undefined}
        />
      )}
    </div>
  );
}
