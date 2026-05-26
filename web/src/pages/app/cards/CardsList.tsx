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

  const fetchCards = async () => {
    const { data } = await api.get('/cards');
    setCards(data);
  };

  const fetchAccounts = async () => {
    const { data } = await api.get('/accounts');
    setAccounts(data);
  };

  useEffect(() => { fetchCards(); fetchAccounts(); }, []);

  const getUsedLimit = (card: CardData) => {
    return card.invoices
      .filter((i) => i.status !== 'paid')
      .reduce((sum, i) => sum + i.totalInCents, 0);
  };

  const handleDelete = async (id: string) => {
    await api.delete('/cards/' + id);
    fetchCards();
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Cartoes</h1>
        <button
          onClick={() => { setEditingCard(null); setShowForm(true); }}
          className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"
        >
          <Plus size={16} className="text-white" />
        </button>
      </header>

      <div className="space-y-4">
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
              <div className="glass-card p-3 -mt-2 rounded-t-none">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-text-secondary">Usado: {formatCurrency(used)}</span>
                  <span className="text-text-secondary">Disponivel: {formatCurrency(available)}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: Math.min(usedPercent, 100) + '%',
                      backgroundColor: usedPercent > 80 ? 'var(--color-danger)' : 'var(--color-primary)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                  <span>Fecha dia {card.closingDay}</span>
                  <span>Vence dia {card.dueDay}</span>
                </div>
              </div>
            </button>
          );
        })}
        {cards.length === 0 && (
          <div className="glass-card p-6 text-center">
            <CreditCard size={32} className="mx-auto mb-2 text-text-tertiary" />
            <p className="text-text-tertiary text-sm">Nenhum cartao cadastrado.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
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