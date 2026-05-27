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
  const [compareMode, setCompareMode] = useState(false);

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

    // Transações reais
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getDate() === day) {
        events.push({
          id: tx.id,
          type: tx.type,
          description: tx.description,
          amountInCents: tx.amountInCents,
          color: tx.category?.color,
        });
      }
    });

    // Assinaturas previstas
    subscriptions.forEach((sub) => {
      if (sub.billingDay === day) {
        events.push({
          id: 'sub-' + sub.id,
          type: 'subscription',
          description: sub.name,
          amountInCents: sub.amountInCents,
        });
      }
    });

    // Cartões - fechamento e vencimento
    cards.forEach((card: any) => {
      if (card.closingDay === day) {
        events.push({
          id: 'close-' + card.id,
          type: 'invoice_close',
          description: `${card.name} - Fecha fatura`,
        });
      }
      if (card.dueDay === day) {
        events.push({
          id: 'due-' + card.id,
          type: 'invoice_due',
          description: `${card.name} - Vence fatura`,
        });
      }
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

  // Resumo do mês
  const monthIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountInCents, 0);
  const monthExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountInCents, 0);
  const monthSubscriptions = subscriptions.reduce((s, sub) => {
    if (sub.cycle === 'monthly') return s + sub.amountInCents;
    if (sub.cycle === 'yearly') return s + Math.round(sub.amountInCents / 12);
    if (sub.cycle === 'weekly') return s + sub.amountInCents * 4;
    return s + sub.amountInCents * 2;
  }, 0);

  // Comparação com semanas
  const getWeekTotal = (weekNum: number) => {
    const startDay = (weekNum - 1) * 7 + 1;
    const endDay = Math.min(weekNum * 7, daysInMonth);
    return transactions
      .filter((t) => {
        const d = new Date(t.date).getDate();
        return d >= startDay && d <= endDay && t.type === 'expense';
      })
      .reduce((s, t) => s + t.amountInCents, 0);
  };

  const weeks = [1, 2, 3, 4, 5].filter((w) => (w - 1) * 7 + 1 <= daysInMonth);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'income': return <TrendingUp size={12} className="text-success" />;
      case 'expense': return <TrendingDown size={12} className="text-danger" />;
      case 'subscription': return <RefreshCw size={12} className="text-warning" />;
      case 'invoice_close': return <CreditCard size={12} className="text-primary" />;
      case 'invoice_due': return <CreditCard size={12} className="text-danger" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-surface-hover">
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-base font-semibold text-text-primary capitalize">{monthName}</h1>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-surface-hover">
          <ChevronRight size={20} className="text-text-secondary" />
        </button>
      </header>

      {/* Resumo do mês */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 text-center">
          <p className="text-[10px] text-text-tertiary">Receitas</p>
          <p className="text-xs font-bold text-success">{formatCurrency(monthIncome)}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-[10px] text-text-tertiary">Despesas</p>
          <p className="text-xs font-bold text-danger">{formatCurrency(monthExpense)}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-[10px] text-text-tertiary">Assinaturas</p>
          <p className="text-xs font-bold text-warning">{formatCurrency(monthSubscriptions)}</p>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 px-1">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success" /><span className="text-[9px] text-text-tertiary">Receita</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-danger" /><span className="text-[9px] text-text-tertiary">Despesa</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning" /><span className="text-[9px] text-text-tertiary">Assinatura</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-[9px] text-text-tertiary">Cartao</span></div>
      </div>

      {/* Calendário */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[10px] text-text-tertiary font-medium py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={'empty-' + i} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const { hasIncome, hasExpense, hasSubscription, hasCard } = getDayIndicator(day);
            const isSelected = selectedDay === day;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={'relative flex flex-col items-center py-1.5 rounded-lg transition-colors ' +
                  (isSelected ? 'bg-primary/20 border border-primary/40' : isToday ? 'bg-surface-hover' : 'hover:bg-surface-hover')}
              >
                <span className={'text-xs ' + (isSelected ? 'text-primary font-bold' : isToday ? 'text-text-primary font-semibold' : 'text-text-secondary')}>
                  {day}
                </span>
                <div className="flex gap-0.5 mt-0.5">
                  {hasIncome && <div className="w-1 h-1 rounded-full bg-success" />}
                  {hasExpense && <div className="w-1 h-1 rounded-full bg-danger" />}
                  {hasSubscription && <div className="w-1 h-1 rounded-full bg-warning" />}
                  {hasCard && <div className="w-1 h-1 rounded-full bg-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Eventos do dia selecionado */}
      {selectedDay && (
        <div className="space-y-2 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-text-primary">
            {selectedDay}/{month + 1}/{year}
          </h2>
          {selectedEvents.length === 0 ? (
            <p className="text-text-tertiary text-sm">Nenhum evento neste dia.</p>
          ) : (
            selectedEvents.map((ev) => (
              <div key={ev.id} className="glass-card p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center">
                  {getEventIcon(ev.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{ev.description}</p>
                  <p className="text-[10px] text-text-tertiary">
                    {ev.type === 'income' ? 'Receita' : ev.type === 'expense' ? 'Despesa' : ev.type === 'subscription' ? 'Assinatura prevista' : ev.type === 'invoice_close' ? 'Fechamento fatura' : 'Vencimento fatura'}
                  </p>
                </div>
                {ev.amountInCents && (
                  <p className={'text-sm font-semibold ' + (ev.type === 'income' ? 'text-success' : 'text-danger')}>
                    {ev.type === 'income' ? '+' : '-'}{formatCurrency(ev.amountInCents)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Comparação por semana */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-text-secondary uppercase">Gastos por semana</h3>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={'text-[10px] px-2 py-1 rounded-lg transition-colors ' + (compareMode ? 'bg-primary/15 text-primary' : 'text-text-tertiary hover:text-text-primary')}
          >
            {compareMode ? 'Valores' : 'Comparar'}
          </button>
        </div>
        <div className="space-y-2">
          {weeks.map((w) => {
            const total = getWeekTotal(w);
            const maxWeek = Math.max(...weeks.map(getWeekTotal), 1);
            const percent = (total / maxWeek) * 100;
            const startDay = (w - 1) * 7 + 1;
            const endDay = Math.min(w * 7, daysInMonth);

            return (
              <div key={w} className="flex items-center gap-3">
                <span className="text-[10px] text-text-tertiary w-14 shrink-0">
                  {startDay}-{endDay}
                </span>
                <div className="flex-1 h-5 rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className="h-full rounded-full bg-danger/60 transition-all duration-300"
                    style={{ width: percent + '%' }}
                  />
                </div>
                <span className="text-[10px] font-medium text-text-primary w-16 text-right">
                  {formatCurrency(total)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}