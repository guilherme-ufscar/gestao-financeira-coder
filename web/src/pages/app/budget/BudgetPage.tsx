import { useEffect, useState } from 'react';
import { Plus, X, Target, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';

const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  limitInCents: z.number().positive(),
});

const goalSchema = z.object({
  name: z.string().min(1),
  targetInCents: z.number().positive(),
  currentInCents: z.number().default(0),
  deadline: z.string().optional(),
});

const debtSchema = z.object({
  description: z.string().min(1),
  totalInCents: z.number().positive(),
  remainingInCents: z.number(),
  creditor: z.string().optional(),
  dueDate: z.string().optional(),
});

type Tab = 'budget' | 'goals' | 'debts';

export default function BudgetPage() {
  const [tab, setTab] = useState<Tab>('budget');
  const [budgets, setBudgets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchData = async () => {
    const [b, g, d, c] = await Promise.all([
      api.get('/budget?month=' + month + '&year=' + year),
      api.get('/budget/goals'),
      api.get('/budget/debts'),
      api.get('/transactions/categories'),
    ]);
    setBudgets(b.data);
    setGoals(g.data);
    setDebts(d.data);
    setCategories(c.data);

    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 0).toISOString();
    const txRes = await api.get('/transactions?startDate=' + start + '&endDate=' + end + '&type=expense&limit=500');
    setTransactions(txRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const getSpentForCategory = (categoryId: string) => {
    return transactions
      .filter((t: any) => t.categoryId === categoryId)
      .reduce((s: number, t: any) => s + t.amountInCents, 0);
  };

  const budgetForm = useForm<any>({ resolver: zodResolver(budgetSchema) });
  const goalForm = useForm<any>({ resolver: zodResolver(goalSchema), defaultValues: { currentInCents: 0 } });
  const debtForm = useForm({ resolver: zodResolver(debtSchema) });

  const onBudgetSubmit = async (data: any) => {
    setLoading(true);
    await api.post('/budget', { ...data, month, year });
    setShowForm(false);
    setLoading(false);
    fetchData();
  };

  const onGoalSubmit = async (data: any) => {
    setLoading(true);
    await api.post('/budget/goals', data);
    setShowForm(false);
    setLoading(false);
    fetchData();
  };

  const onDebtSubmit = async (data: any) => {
    setLoading(true);
    await api.post('/budget/debts', data);
    setShowForm(false);
    setLoading(false);
    fetchData();
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">
          {tab === 'budget' ? 'Orcamento' : tab === 'goals' ? 'Metas' : 'Dividas'}
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"
        >
          <Plus size={16} className="text-white" />
        </button>
      </header>

      <div className="flex gap-2">
        {(['budget', 'goals', 'debts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={'flex-1 py-2 rounded-xl text-xs font-medium transition-colors ' +
              (tab === t ? 'gradient-primary text-white' : 'glass-card text-text-secondary')}
          >
            {t === 'budget' ? 'Orcamento' : t === 'goals' ? 'Metas' : 'Dividas'}
          </button>
        ))}
      </div>

      {tab === 'budget' && (
        <div className="space-y-2">
          {budgets.map((b: any) => {
            const spent = getSpentForCategory(b.categoryId);
            const percent = b.limitInCents > 0 ? (spent / b.limitInCents) * 100 : 0;
            const isOver = percent > 100;
            return (
              <div key={b.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">{b.category?.name}</span>
                  <span className={'text-xs ' + (isOver ? 'text-danger' : 'text-text-secondary')}>
                    {formatCurrency(spent)} / {formatCurrency(b.limitInCents)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: Math.min(percent, 100) + '%',
                      backgroundColor: isOver ? 'var(--color-danger)' : percent > 80 ? 'var(--color-warning)' : 'var(--color-primary)',
                    }}
                  />
                </div>
                {isOver && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle size={10} className="text-danger" />
                    <span className="text-[10px] text-danger">Orcamento estourado</span>
                  </div>
                )}
              </div>
            );
          })}
          {budgets.length === 0 && (
            <div className="glass-card p-6 text-center">
              <p className="text-text-tertiary text-sm">Nenhum orcamento definido para este mes.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div className="space-y-2">
          {goals.map((g: any) => {
            const percent = g.targetInCents > 0 ? (g.currentInCents / g.targetInCents) * 100 : 0;
            return (
              <div key={g.id} className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} style={{ color: g.color }} />
                  <span className="text-sm font-medium text-text-primary">{g.name}</span>
                </div>
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                  <span>{formatCurrency(g.currentInCents)}</span>
                  <span>{formatCurrency(g.targetInCents)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface">
                  <div
                    className="h-full rounded-full"
                    style={{ width: Math.min(percent, 100) + '%', backgroundColor: g.color }}
                  />
                </div>
                <p className="text-[10px] text-text-tertiary mt-1">{percent.toFixed(0)}% concluido</p>
              </div>
            );
          })}
          {goals.length === 0 && (
            <div className="glass-card p-6 text-center">
              <p className="text-text-tertiary text-sm">Nenhuma meta criada.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'debts' && (
        <div className="space-y-2">
          {debts.map((d: any) => {
            const paidPercent = d.totalInCents > 0 ? ((d.totalInCents - d.remainingInCents) / d.totalInCents) * 100 : 0;
            return (
              <div key={d.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">{d.description}</span>
                  <span className={'text-xs px-2 py-0.5 rounded ' + (d.status === 'paid' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                    {d.status === 'paid' ? 'Quitada' : 'Ativa'}
                  </span>
                </div>
                {d.creditor && <p className="text-[10px] text-text-tertiary mb-1">Credor: {d.creditor}</p>}
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                  <span>Pago: {formatCurrency(d.totalInCents - d.remainingInCents)}</span>
                  <span>Total: {formatCurrency(d.totalInCents)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface">
                  <div className="h-full rounded-full bg-primary" style={{ width: paidPercent + '%' }} />
                </div>
              </div>
            );
          })}
          {debts.length === 0 && (
            <div className="glass-card p-6 text-center">
              <p className="text-text-tertiary text-sm">Nenhuma divida registrada.</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="relative glass-card-lg w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">
                {tab === 'budget' ? 'Novo orcamento' : tab === 'goals' ? 'Nova meta' : 'Nova divida'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-text-tertiary"><X size={20} /></button>
            </div>

            {tab === 'budget' && (
              <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="space-y-3">
                <select className="input-field" {...budgetForm.register('categoryId')}>
                  <option value="">Categoria</option>
                  {categories.filter((c: any) => c.type === 'expense').map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="Limite (R$)"
                  onChange={(e) => budgetForm.setValue('limitInCents', Math.round(parseFloat(e.target.value || '0') * 100))}
                />
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">Salvar</button>
              </form>
            )}

            {tab === 'goals' && (
              <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-3">
                <input className="input-field" placeholder="Nome da meta" {...goalForm.register('name')} />
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="Valor alvo (R$)"
                  onChange={(e) => goalForm.setValue('targetInCents', Math.round(parseFloat(e.target.value || '0') * 100))}
                />
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="Valor atual (R$)"
                  onChange={(e) => goalForm.setValue('currentInCents', Math.round(parseFloat(e.target.value || '0') * 100))}
                />
                <input type="date" className="input-field" placeholder="Prazo" {...goalForm.register('deadline')} />
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">Salvar</button>
              </form>
            )}

            {tab === 'debts' && (
              <form onSubmit={debtForm.handleSubmit(onDebtSubmit)} className="space-y-3">
                <input className="input-field" placeholder="Descricao" {...debtForm.register('description')} />
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="Valor total (R$)"
                  onChange={(e) => {
                    const v = Math.round(parseFloat(e.target.value || '0') * 100);
                    debtForm.setValue('totalInCents', v);
                    debtForm.setValue('remainingInCents', v);
                  }}
                />
                <input className="input-field" placeholder="Credor (opcional)" {...debtForm.register('creditor')} />
                <input type="date" className="input-field" {...debtForm.register('dueDate')} />
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">Salvar</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}