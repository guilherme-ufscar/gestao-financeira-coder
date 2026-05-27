import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, CreditCard, RefreshCw } from 'lucide-react';
import api from '../../lib/api/client';
import { formatCurrency } from '../../lib/utils';

interface DayEvent {
  id: string;
  type: 'income' | 'expense' | 'subscription' | 'invoice_close' | 'invoice_due';
  description: string;
  amountInCents?: number;
  color?: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0).toISOString();
    api.get('/transactions?startDate=' + start + '&endDate=' + end + '&limit=200').then((r) => setTransactions(r.data));
    api.get('/subscriptions').then((r) => setSubscriptions(r.data.filter((s: any) => s.active)));
    api.get('/cards').then((r) => setCards(r.data));
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const getDayEvents = (day: number): DayEvent[] => {
    const events: DayEvent[] = [];
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getDate() === day) {
        events.push({ id: tx.id, type: tx.type, description: tx.description, amountInCents: tx.amountInCents, color: tx.category?.color });
      }
    });
    subscriptions.forEach((sub) => {
      if (sub.billingDay === day) {
        events.push({ id: 'sub-' + sub.id, type: 'subscription', description: sub.name, amountInCents: sub.amountInCents });
      }
    });
    cards.forEach((card: any) => {
      if (card.closingDay === day) events.push({ id: 'close-' + card.id, type: 'invoice_close', description: `${card.name} - Fecha fatura` });
      if (card.dueDay === day) events.push({ id: 'due-' + card.id, type: 'invoice_due', description: `${card.name} - Vence fatura` });
    });
    return events;
  };

  const getDayIndicator = (day: number) => {
    const events = getDayEvents(day);
    return {
      hasIncome: events.some((e) => e.type === 'income'),
      hasExpense: events.some((e) => e.type === 'expense'),
      hasSubscription: events.some((e) => e.type === 'subscription'),
      hasCard: events.some((e) => e.type === 'invoice_close' || e.type === 'invoice_due'),
    };
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const selectedEvents = selectedDay ? getDayEvents(selectedDay) : [];

  const monthIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountInCents, 0);
  const monthExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountInCents, 0);
  const monthSubscriptions = subscriptions.reduce((s, sub) => {
    if (sub.cycle === 'monthly') return s + sub.amountInCents;
    if (sub.cycle === 'yearly') return s + Math.round(sub.amountInCents / 12);
    if (sub.cycle === 'weekly') return s + sub.amountInCents * 4;
    return s + sub.amountInCents * 2;
  }, 0);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'income': return <TrendingUp size={14} className="text-success" />;
      case 'expense': return <TrendingDown size={14} className="text-danger" />;
      case 'subscription': return <RefreshCw size={14} className="text-warning" />;
      case 'invoice_close': return <CreditCard size={14} className="text-primary" />;
      case 'invoice_due': return <CreditCard size={14} className="text-danger" />;
      default: return null;
    }
  };

  return (
    <div className="p-5 space-y-5">
      <header className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-high transition-colors">
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-title-lg text-text-primary capitalize">{monthName}</h1>
        <button onClick={nextMonth} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-high transition-colors">
          <ChevronRight size={20} className="text-text-secondary" />
        </button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <div className="m3-card-elevated p-3.5 text-center">
          <p className="text-caption text-text-tertiary">Receitas</p>
          <p className="text-label font-bold text-success">{formatCurrency(monthIncome)}</p>
        </div>
        <div className="m3-card-elevated p-3.5 text-center">
          <p className="text-caption text-text-tertiary">Despesas</p>
          <p className="text-label font-bold text-danger">{formatCurrency(monthExpense)}</p>
        </div>
        <div className="m3-card-elevated p-3.5 text-center">
          <p className="text-caption text-text-tertiary">Assinaturas</p>
          <p className="text-label font-bold text-warning">{formatCurrency(monthSubscriptions)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 px-1">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-success" /><span className="text-caption text-text-tertiary">Receita</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-danger" /><span className="text-caption text-text-tertiary">Despesa</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-warning" /><span className="text-caption text-text-tertiary">Assinatura</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-caption text-text-tertiary">Cartao</span></div>
      </div>

      <div className="m3-card-elevated p-5">
        <div className="grid grid-cols-7 gap-1 mb-3">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-caption text-text-tertiary font-semibold py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={'empty-' + i} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const { hasIncome, hasExpense, hasSubscription, hasCard } = getDayIndicator(day);
            const isSelected = selectedDay === day;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={'relative flex flex-col items-center py-2 rounded-xl transition-all duration-200 ease-spring ' +
                  (isSelected ? 'bg-primary-container scale-105' : isToday ? 'bg-surface-high' : 'hover:bg-surface-high')}
              >
                <span className={'text-label ' + (isSelected ? 'text-on-primary-container font-bold' : isToday ? 'text-text-primary font-semibold' : 'text-text-secondary')}>
                  {day}
                </span>
                <div className="flex gap-0.5 mt-1">
                  {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
                  {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-danger" />}
                  {hasSubscription && <div className="w-1.5 h-1.5 rounded-full bg-warning" />}
                  {hasCard && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="space-y-2.5 animate-fade-in-up">
          <h2 className="text-title text-text-primary">
            {selectedDay}/{month + 1}/{year}
          </h2>
          {selectedEvents.length === 0 ? (
            <p className="text-text-tertiary text-body">Nenhum evento neste dia.</p>
          ) : (
            selectedEvents.map((ev) => (
              <div key={ev.id} className="m3-card-elevated p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-high flex items-center justify-center">
                  {getEventIcon(ev.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body text-text-primary truncate font-medium">{ev.description}</p>
                  <p className="text-caption text-text-tertiary">
                    {ev.type === 'income' ? 'Receita' : ev.type === 'expense' ? 'Despesa' : ev.type === 'subscription' ? 'Assinatura prevista' : ev.type === 'invoice_close' ? 'Fechamento fatura' : 'Vencimento fatura'}
                  </p>
                </div>
                {ev.amountInCents && (
                  <p className={'text-body font-bold ' + (ev.type === 'income' ? 'text-success' : 'text-danger')}>
                    {ev.type === 'income' ? '+' : '-'}{formatCurrency(ev.amountInCents)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
