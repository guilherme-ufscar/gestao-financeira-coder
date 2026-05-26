import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/api/client';
import { formatCurrency } from '../../lib/utils';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0).toISOString();
    api.get('/transactions?startDate=' + start + '&endDate=' + end + '&limit=200').then((r) => {
      setTransactions(r.data);
    });
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const getDayTransactions = (day: number) => {
    return transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getDate() === day;
    });
  };

  const getDayIndicator = (day: number) => {
    const dayTxs = getDayTransactions(day);
    const hasIncome = dayTxs.some((t) => t.type === 'income');
    const hasExpense = dayTxs.some((t) => t.type === 'expense');
    return { hasIncome, hasExpense };
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  const selectedTransactions = selectedDay ? getDayTransactions(selectedDay) : [];

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
            const { hasIncome, hasExpense } = getDayIndicator(day);
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
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-primary">
            {selectedDay}/{month + 1}/{year}
          </h2>
          {selectedTransactions.length === 0 ? (
            <p className="text-text-tertiary text-sm">Nenhum lancamento neste dia.</p>
          ) : (
            selectedTransactions.map((tx) => (
              <div key={tx.id} className="glass-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{tx.description}</p>
                  <p className="text-[10px] text-text-tertiary">{tx.category?.name || 'Sem categoria'}</p>
                </div>
                <p className={'text-sm font-semibold ' + (tx.type === 'income' ? 'text-success' : 'text-danger')}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amountInCents)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}