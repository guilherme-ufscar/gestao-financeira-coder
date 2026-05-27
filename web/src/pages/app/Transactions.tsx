import { useEffect, useState } from 'react';
import { Search, TrendingUp, TrendingDown, X, Trash2, Pencil } from 'lucide-react';
import api from '../../lib/api/client';
import { formatCurrency } from '../../lib/utils';
import CurrencyInput from '../../components/ui/CurrencyInput';
import { getCategoryIcon } from './categories/CategoriesPage';

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
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState(0);
  const [editDate, setEditDate] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTransactions = () => {
    const params = filter === 'all' ? '' : '?type=' + filter;
    api.get('/transactions' + params + (params ? '&' : '?') + 'limit=100').then((r) => setTransactions(r.data));
  };

  useEffect(() => { fetchTransactions(); }, [filter]);

  const filtered = search
    ? transactions.filter((tx) => tx.description?.toLowerCase().includes(search.toLowerCase()))
    : transactions;

  const grouped = groupByDate(filtered);
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amountInCents, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountInCents, 0);

  return (
    <div className="p-5 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-headline text-text-primary">Transacoes</h1>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="m3-icon-container-sm bg-surface-container transition-all duration-200 ease-spring hover:bg-surface-high"
        >
          <Search size={18} className="text-text-secondary" />
        </button>
      </header>

      {showSearch && (
        <input
          className="m3-input animate-fade-in-up"
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
            className={'m3-chip ' + (filter === f.key ? 'm3-chip-selected' : '')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="m3-card-elevated p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center">
            <TrendingUp size={16} className="text-success" />
          </div>
          <div>
            <p className="text-caption text-text-tertiary">Receitas</p>
            <p className="text-label font-bold text-success">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
        <div className="m3-card-elevated p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-danger/15 flex items-center justify-center">
            <TrendingDown size={16} className="text-danger" />
          </div>
          <div>
            <p className="text-caption text-text-tertiary">Despesas</p>
            <p className="text-label font-bold text-danger">{formatCurrency(totalExpense)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {grouped.map(([dateKey, txs]) => (
          <div key={dateKey}>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-label font-semibold text-text-secondary uppercase">{formatGroupDate(dateKey)}</span>
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="text-caption text-text-tertiary">
                {txs.length} {txs.length === 1 ? 'lancamento' : 'lancamentos'}
              </span>
            </div>
            <div className="space-y-2">
              {txs.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => {
                    setSelectedTx(tx);
                    setEditDesc(tx.description || '');
                    setEditAmount(tx.amountInCents);
                    setEditDate(new Date(tx.date).toISOString().split('T')[0]);
                    setEditMode(false);
                  }}
                  className="m3-card w-full p-4 flex items-center gap-3 hover:bg-surface-high transition-all duration-200 text-left"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: (tx.category?.color || '#B794F6') + '18' }}
                  >
                    {(() => { const Icon = getCategoryIcon(tx.category?.icon || ''); return <Icon size={18} style={{ color: tx.category?.color || '#B794F6' }} />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-text-primary truncate font-medium">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {tx.category && (
                        <span className="text-caption px-2 py-0.5 rounded-full" style={{ backgroundColor: tx.category.color + '18', color: tx.category.color }}>
                          {tx.category.name}
                        </span>
                      )}
                      {tx.account && <span className="text-caption text-text-tertiary">{tx.account.name}</span>}
                      {tx.creditCard && <span className="text-caption text-text-tertiary">{tx.creditCard.name}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={'text-body font-bold ' + (tx.type === 'income' ? 'text-success' : 'text-danger')}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amountInCents)}
                    </p>
                    {tx.status === 'pending' && (
                      <span className="text-caption px-2 py-0.5 rounded-full bg-warning-container/30 text-warning font-medium">Pendente</span>
                    )}
                    {tx.installments && tx.installments.length > 0 && (
                      <p className="text-caption text-text-tertiary mt-0.5">
                        {tx.installments[0].number}/{tx.installments[0].totalCount}x
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="m3-card-filled p-10 text-center">
            <Search size={32} className="mx-auto mb-3 text-text-tertiary opacity-50" />
            <p className="text-text-tertiary text-body">Nenhuma transacao encontrada</p>
          </div>
        )}
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTx(null)} />
          <div className="relative m3-dialog w-full max-w-md p-7 m-4 animate-slide-up sm:animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-title-lg text-text-primary">
                {editMode ? 'Editar transacao' : 'Detalhes'}
              </h2>
              <button onClick={() => setSelectedTx(null)} className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            {!editMode ? (
              <div className="space-y-3">
                <div className="m3-card-filled p-4 rounded-xl">
                  <p className="text-caption text-text-tertiary mb-1">Descricao</p>
                  <p className="text-body font-medium text-text-primary">{selectedTx.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="m3-card-filled p-4 rounded-xl">
                    <p className="text-caption text-text-tertiary mb-1">Valor</p>
                    <p className={'text-body font-bold ' + (selectedTx.type === 'income' ? 'text-success' : 'text-danger')}>
                      {selectedTx.type === 'income' ? '+' : '-'}{formatCurrency(selectedTx.amountInCents)}
                    </p>
                  </div>
                  <div className="m3-card-filled p-4 rounded-xl">
                    <p className="text-caption text-text-tertiary mb-1">Data</p>
                    <p className="text-body text-text-primary">
                      {new Date(selectedTx.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                {selectedTx.category && (
                  <div className="m3-card-filled p-4 rounded-xl">
                    <p className="text-caption text-text-tertiary mb-1">Categoria</p>
                    <span className="text-label px-3 py-1 rounded-full" style={{ backgroundColor: selectedTx.category.color + '18', color: selectedTx.category.color }}>
                      {selectedTx.category.name}
                    </span>
                  </div>
                )}
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex-1 m3-btn-tonal"
                  >
                    <Pencil size={16} /> Editar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Tem certeza que deseja excluir esta transacao?')) return;
                      setLoading(true);
                      try {
                        await api.delete('/transactions/' + selectedTx.id);
                        setSelectedTx(null);
                        fetchTransactions();
                      } catch {} finally { setLoading(false); }
                    }}
                    disabled={loading}
                    className="m3-btn-outlined border-danger/40 text-danger hover:bg-danger/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-label text-text-secondary mb-2 pl-1">Descricao</label>
                  <input className="m3-input" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                </div>
                <div>
                  <label className="block text-label text-text-secondary mb-2 pl-1">Valor</label>
                  <CurrencyInput value={editAmount} onChange={(v) => setEditAmount(v)} />
                </div>
                <div>
                  <label className="block text-label text-text-secondary mb-2 pl-1">Data</label>
                  <input type="date" className="m3-input" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setEditMode(false)} className="flex-1 m3-btn-outlined">
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await api.put('/transactions/' + selectedTx.id, {
                          description: editDesc,
                          amountInCents: editAmount,
                          date: editDate,
                        });
                        setSelectedTx(null);
                        fetchTransactions();
                      } catch {} finally { setLoading(false); }
                    }}
                    disabled={loading}
                    className="flex-1 m3-btn disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
