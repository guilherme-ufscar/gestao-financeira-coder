import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import api from '../../lib/api/client';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    const params = filter === 'all' ? '' : '?type=' + filter;
    api.get('/transactions' + params).then((r) => setTransactions(r.data));
  }, [filter]);

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Transacoes</h1>
        <Filter size={18} className="text-text-tertiary" />
      </header>

      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' +
              (filter === f ? 'gradient-primary text-white' : 'glass-card text-text-secondary')}
          >
            {f === 'all' ? 'Todas' : f === 'income' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {transactions.map((tx) => (
          <div key={tx.id} className="glass-card p-3 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: (tx.category?.color || '#6D5FFD') + '20' }}
            >
              <span className="text-xs font-bold" style={{ color: tx.category?.color || '#6D5FFD' }}>
                {(tx.category?.name || '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{tx.description}</p>
              <p className="text-[10px] text-text-tertiary">
                {formatDate(tx.date)}
                {tx.account && (' - ' + tx.account.name)}
                {tx.creditCard && (' - ' + tx.creditCard.name)}
              </p>
            </div>
            <div className="text-right">
              <p className={'text-sm font-semibold ' + (tx.type === 'income' ? 'text-success' : 'text-danger')}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amountInCents)}
              </p>
              {tx.installments && tx.installments.length > 0 && (
                <p className="text-[10px] text-text-tertiary">
                  {tx.installments[0].number}/{tx.installments[0].totalCount}x
                </p>
              )}
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="glass-card p-6 text-center">
            <p className="text-text-tertiary text-sm">Nenhuma transacao encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}