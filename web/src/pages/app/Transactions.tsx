import { useEffect, useState } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../lib/api/client';
import { formatCurrency } from '../../lib/utils';

function groupByDate(transactions: any[]) {
  const groups: Record<string, any[]> = {};
  transactions.forEach((tx) => {
    const dateKey = new Date(tx.date).toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const params = filter === 'all' ? '' : '?type=' + filter;
    api.get('/transactions' + params + (params ? '&' : '?') + 'limit=100').then((r) => setTransactions(r.data));
  }, [filter]);

  const filtered = search
    ? transactions.filter((tx) => tx.description?.toLowerCase().includes(search.toLowerCase()))
    : transactions;

  const grouped = groupByDate(filtered);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amountInCents, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountInCents, 0);

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Transacoes</h1>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center"
        >
          <Search size={16} className="text-text-secondary" />
        </button>
      </header>

      {showSearch && (
        <input
          className="input-field animate-fade-in-up"
          placeholder="Buscar transacao..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      )}

      <div className="flex gap-2">
        {([
          { key: 'all', label: 'Todas' },
          { key: 'income', label: 'Receitas' },
          { key: 'expense', label: 'Despesas' },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={'chip ' + (filter === f.key ? 'chip-active' : '')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="glass-card p-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
            <TrendingUp size={13} className="text-success" />
          </div>
          <div>
            <p className="text-[10px] text-text-tertiary">Receitas</p>
            <p className="text-xs font-bold text-success">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
        <div className="glass-card p-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-danger/10 flex items-center justify-center">
            <TrendingDown size={13} className="text-danger" />
          </div>
          <div>
            <p className="text-[10px] text-text-tertiary">Despesas</p>
            <p className="text-xs font-bold text-danger">{formatCurrency(totalExpense)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {grouped.map(([dateKey, txs]) => (
          <div key={dateKey}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase">{formatGroupDate(dateKey)}</span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-text-tertiary">
                {txs.length} {txs.length === 1 ? 'lancamento' : 'lancamentos'}
              </span>
            </div>
            <div className="space-y-1.5">
              {txs.map((tx) => (
                <div key={tx.id} className="glass-card p-3.5 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: (tx.category?.color || '#6D5FFD') + '15' }}
                  >
                    <span className="text-xs font-bold" style={{ color: tx.category?.color || '#6D5FFD' }}>
                      {(tx.category?.name || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate font-medium">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {tx.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: tx.category.color + '15', color: tx.category.color }}>
                          {tx.category.name}
                        </span>
                      )}
                      {tx.account && (
                        <span className="text-[10px] text-text-tertiary">{tx.account.name}</span>
                      )}
                      {tx.creditCard && (
                        <span className="text-[10px] text-text-tertiary">{tx.creditCard.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={'text-sm font-bold ' + (tx.type === 'income' ? 'text-success' : 'text-danger')}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amountInCents)}
                    </p>
                    {tx.status === 'pending' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">Pendente</span>
                    )}
                    {tx.installments && tx.installments.length > 0 && (
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        {tx.installments[0].number}/{tx.installments[0].totalCount}x
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Search size={28} className="mx-auto mb-3 text-text-tertiary opacity-50" />
            <p className="text-text-tertiary text-sm">Nenhuma transacao encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}